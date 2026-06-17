package com.quickbooks.service;

import com.quickbooks.dto.company.CompanyResponse;
import com.quickbooks.dto.company.CreateCompanyRequest;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberSubscriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final SubscriberRepository subscriberRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;
    private final BusinessTypeService businessTypeService;

    public CompanyService(CompanyRepository companyRepository,
                          SubscriberRepository subscriberRepository,
                          SubscriberSubscriptionRepository subscriberSubscriptionRepository,
                          BusinessTypeService businessTypeService) {
        this.companyRepository = companyRepository;
        this.subscriberRepository = subscriberRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
        this.businessTypeService = businessTypeService;
    }

    @Transactional
    public Company ensureDefaultCompany(Long subscriberId, String fallbackName) {
        Subscriber subscriber = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found"));

        if (subscriber.getDefaultCompany() != null && subscriber.getDefaultCompany().isActive()) {
            return subscriber.getDefaultCompany();
        }

        Company company = companyRepository.findFirstBySubscriberIdAndActiveTrueOrderByCreatedAtAsc(subscriberId)
                .orElseGet(() -> {
                    Company created = new Company();
                    created.setSubscriber(subscriber);
                    created.setName(normalizeCompanyName(fallbackName));
                    created.setBusinessType(subscriber.getBusinessType());
                    created.setActive(true);
                    return companyRepository.save(created);
                });

        subscriber.setDefaultCompany(company);
        subscriberRepository.save(subscriber);
        return company;
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> list(Long subscriberId, Long selectedCompanyId) {
        return companyRepository.findBySubscriberIdAndActiveTrueOrderByNameAsc(subscriberId).stream()
                .map(company -> CompanyResponse.from(company, selectedCompanyId))
                .toList();
    }

    @Transactional
    public CompanyResponse create(Long subscriberId, CreateCompanyRequest request) {
        Subscriber subscriber = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found"));

        String name = normalizeCompanyName(request.getName());
        BusinessType businessType = businessTypeService.getById(request.getBusinessTypeId());
        if (!businessType.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected business type is not active");
        }
        if (companyRepository.existsBySubscriberIdAndNameIgnoreCase(subscriberId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Company name already exists");
        }

        long currentCount = companyRepository.countBySubscriberIdAndActiveTrue(subscriberId);
        long maxAllowed = resolveMaxAllowedCompanies(subscriberId);
        if (maxAllowed > 0 && currentCount >= maxAllowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your plan allows up to " + maxAllowed + " companies. Upgrade to add more."
            );
        }

        Company company = new Company();
        company.setSubscriber(subscriber);
        company.setName(name);
        company.setBusinessType(businessType);
        company.setActive(true);
        Company saved = companyRepository.save(company);

        if (subscriber.getDefaultCompany() == null) {
            subscriber.setDefaultCompany(saved);
            subscriberRepository.save(subscriber);
        }

        return CompanyResponse.from(saved, subscriber.getDefaultCompany() != null ? subscriber.getDefaultCompany().getId() : null);
    }

    @Transactional(readOnly = true)
    public Company requireAccessibleCompany(Long subscriberId, Long companyId) {
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company ID is required");
        }
        return companyRepository.findByIdAndSubscriberIdAndActiveTrue(companyId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Company not accessible"));
    }

    private String normalizeCompanyName(String raw) {
        if (raw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required");
        }
        String name = raw.trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required");
        }
        return name;
    }

    private long resolveMaxAllowedCompanies(Long subscriberId) {
        SubscriberSubscription activeSubscription = subscriberSubscriptionRepository
                .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(subscriberId, SubscriptionRecordStatus.ACTIVE)
                .orElse(null);
        if (activeSubscription == null) {
            return 1;
        }
        SubscriptionPlan plan = activeSubscription.getPlan();
        if (plan.getMaxCompanies() == null || plan.getMaxCompanies() < 1) {
            return 1;
        }
        return plan.getMaxCompanies();
    }
}
