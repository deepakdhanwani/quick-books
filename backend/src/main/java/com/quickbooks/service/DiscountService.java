package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.discount.CreateDiscountRequest;
import com.quickbooks.dto.discount.DiscountResponse;
import com.quickbooks.dto.discount.UpdateDiscountRequest;
import com.quickbooks.entity.Discount;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.DiscountScope;
import com.quickbooks.entity.enums.DiscountType;
import com.quickbooks.repository.DiscountRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberSubscriptionRepository;
import com.quickbooks.repository.SubscriptionPlanRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final SubscriberRepository subscriberRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;

    public DiscountService(DiscountRepository discountRepository,
                           SubscriberRepository subscriberRepository,
                           SubscriptionPlanRepository subscriptionPlanRepository,
                           SubscriberSubscriptionRepository subscriberSubscriptionRepository) {
        this.discountRepository = discountRepository;
        this.subscriberRepository = subscriberRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<DiscountResponse> findPage(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<DiscountResponse> result = discountRepository.findAll(pageable)
                .map(DiscountResponse::from);

        return PageResponse.from(result);
    }

    @Transactional
    public DiscountResponse create(CreateDiscountRequest request) {
        String name = request.getName().trim();
        if (discountRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Discount already exists");
        }

        validateValue(request.getType(), request.getValue());
        validateDateRange(request.getValidFrom(), request.getValidTo());

        Discount discount = new Discount();
        discount.setName(name);
        discount.setType(request.getType());
        discount.setValue(request.getValue());
        discount.setScope(request.getScope());
        discount.setValidFrom(request.getValidFrom());
        discount.setValidTo(request.getValidTo());
        discount.setApplicablePlans(resolvePlans(request.getPlanIds()));
        discount.setSpecificSubscribers(resolveSubscribers(request.getScope(), request.getSubscriberIds()));
        discount.setActive(true);

        return DiscountResponse.from(discountRepository.save(discount));
    }

    @Transactional
    public DiscountResponse update(Long id, UpdateDiscountRequest request) {
        Discount discount = getById(id);
        String name = request.getName().trim();

        if (discountRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Discount name already exists");
        }

        validateValue(request.getType(), request.getValue());
        validateDateRange(request.getValidFrom(), request.getValidTo());

        discount.setName(name);
        discount.setType(request.getType());
        discount.setValue(request.getValue());
        discount.setScope(request.getScope());
        discount.setValidFrom(request.getValidFrom());
        discount.setValidTo(request.getValidTo());
        discount.setApplicablePlans(resolvePlans(request.getPlanIds()));
        discount.setSpecificSubscribers(resolveSubscribers(request.getScope(), request.getSubscriberIds()));
        if (request.getActive() != null) {
            discount.setActive(request.getActive());
        }

        return DiscountResponse.from(discountRepository.save(discount));
    }

    @Transactional
    public void delete(Long id) {
        Discount discount = getById(id);

        if (subscriberSubscriptionRepository.existsByDiscount_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete — discount has been applied to subscriptions"
            );
        }

        discountRepository.delete(discount);
    }

    public Discount getById(Long id) {
        return discountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discount not found"));
    }

    private void validateValue(DiscountType type, BigDecimal value) {
        if (type == DiscountType.PERCENTAGE) {
            if (value.compareTo(new BigDecimal("0.01")) < 0 || value.compareTo(new BigDecimal("100.00")) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Percentage must be between 0.01% and 100%");
            }
        }
    }

    private void validateDateRange(LocalDate validFrom, LocalDate validTo) {
        if (validFrom != null && validTo != null && validFrom.isAfter(validTo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid from must be on or before valid to");
        }
    }

    private Set<SubscriptionPlan> resolvePlans(List<Long> planIds) {
        List<Long> distinctIds = planIds.stream().distinct().toList();
        List<SubscriptionPlan> plans = subscriptionPlanRepository.findAllById(distinctIds);

        if (plans.size() != distinctIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more subscription plans not found");
        }

        return new HashSet<>(plans);
    }

    private Set<Subscriber> resolveSubscribers(DiscountScope scope, List<Long> subscriberIds) {
        if (scope == DiscountScope.ALL) {
            return new HashSet<>();
        }

        if (subscriberIds == null || subscriberIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one subscriber");
        }

        List<Long> distinctIds = subscriberIds.stream().distinct().toList();
        List<Subscriber> subscribers = subscriberRepository.findAllById(distinctIds);

        if (subscribers.size() != distinctIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more subscribers not found");
        }

        return new HashSet<>(subscribers);
    }
}
