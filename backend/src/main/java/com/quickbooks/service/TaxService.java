package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.tax.CreateTaxRequest;
import com.quickbooks.dto.tax.TaxResponse;
import com.quickbooks.dto.tax.UpdateTaxRequest;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.Tax;
import com.quickbooks.repository.SubscriptionPlanRepository;
import com.quickbooks.repository.TaxRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class TaxService {

    private final TaxRepository taxRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public TaxService(TaxRepository taxRepository,
                      SubscriptionPlanRepository subscriptionPlanRepository) {
        this.taxRepository = taxRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaxResponse> findPage(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<TaxResponse> result = taxRepository.findAll(pageable)
                .map(TaxResponse::from);

        return PageResponse.from(result);
    }

    @Transactional
    public TaxResponse create(CreateTaxRequest request) {
        String name = request.getName().trim();
        if (taxRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tax already exists");
        }

        Tax tax = new Tax();
        tax.setName(name);
        tax.setRate(request.getRate());
        tax.setApplicablePlans(resolvePlans(request.getPlanIds()));
        tax.setActive(true);

        return TaxResponse.from(taxRepository.save(tax));
    }

    @Transactional
    public TaxResponse update(Long id, UpdateTaxRequest request) {
        Tax tax = getById(id);
        String name = request.getName().trim();

        if (taxRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tax name already exists");
        }

        tax.setName(name);
        tax.setRate(request.getRate());
        tax.setApplicablePlans(resolvePlans(request.getPlanIds()));
        if (request.getActive() != null) {
            tax.setActive(request.getActive());
        }

        return TaxResponse.from(taxRepository.save(tax));
    }

    @Transactional
    public void delete(Long id) {
        Tax tax = getById(id);
        taxRepository.delete(tax);
    }

    public Tax getById(Long id) {
        return taxRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tax not found"));
    }

    private Set<SubscriptionPlan> resolvePlans(List<Long> planIds) {
        List<Long> distinctIds = planIds.stream().distinct().toList();
        List<SubscriptionPlan> plans = subscriptionPlanRepository.findAllById(distinctIds);

        if (plans.size() != distinctIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more subscription plans not found");
        }

        return new HashSet<>(plans);
    }
}
