package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.plan.CreateSubscriptionPlanRequest;
import com.quickbooks.dto.plan.SubscriptionPlanResponse;
import com.quickbooks.dto.plan.UpdateSubscriptionPlanRequest;
import com.quickbooks.entity.SubscriptionPlan;
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

import java.util.List;

@Service
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;

    public SubscriptionPlanService(SubscriptionPlanRepository subscriptionPlanRepository,
                                   SubscriberSubscriptionRepository subscriberSubscriptionRepository) {
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
    }

    public PageResponse<SubscriptionPlanResponse> findPage(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<SubscriptionPlanResponse> result = subscriptionPlanRepository.findAll(pageable)
                .map(SubscriptionPlanResponse::from);

        return PageResponse.from(result);
    }

    public List<SubscriptionPlanResponse> findActive() {
        return subscriptionPlanRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(SubscriptionPlanResponse::from)
                .toList();
    }

    @Transactional
    public SubscriptionPlanResponse create(CreateSubscriptionPlanRequest request) {
        String name = request.getName().trim();
        if (subscriptionPlanRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subscription plan already exists");
        }

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setName(name);
        plan.setDuration(request.getDuration());
        plan.setPrice(request.getPrice());
        plan.setDescription(trimToNull(request.getDescription()));
        plan.setActive(true);

        return SubscriptionPlanResponse.from(subscriptionPlanRepository.save(plan));
    }

    @Transactional
    public SubscriptionPlanResponse update(Long id, UpdateSubscriptionPlanRequest request) {
        SubscriptionPlan plan = getById(id);
        String name = request.getName().trim();

        if (subscriptionPlanRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subscription plan name already exists");
        }

        plan.setName(name);
        plan.setDuration(request.getDuration());
        plan.setPrice(request.getPrice());
        plan.setDescription(trimToNull(request.getDescription()));
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }

        return SubscriptionPlanResponse.from(subscriptionPlanRepository.save(plan));
    }

    @Transactional
    public void delete(Long id) {
        SubscriptionPlan plan = getById(id);

        if (subscriberSubscriptionRepository.existsByPlan_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete — subscribers have used this plan"
            );
        }

        if (subscriptionPlanRepository.existsInTaxAssignments(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete — taxes are assigned to this plan"
            );
        }

        if (subscriptionPlanRepository.existsInDiscountAssignments(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete — discounts are assigned to this plan"
            );
        }

        subscriptionPlanRepository.delete(plan);
    }

    public SubscriptionPlan getById(Long id) {
        return subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription plan not found"));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
