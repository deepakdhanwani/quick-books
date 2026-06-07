package com.quickbooks.service;

import com.quickbooks.dto.subscriber.SubscribeRequest;
import com.quickbooks.dto.subscriber.SubscribeResponse;
import com.quickbooks.dto.subscriber.SubscriberPlanOptionResponse;
import com.quickbooks.dto.subscriber.SubscriberSubscriptionInfo;
import com.quickbooks.entity.Discount;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.Tax;
import com.quickbooks.entity.enums.DiscountType;
import com.quickbooks.entity.enums.PlanDuration;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.DiscountRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberSubscriptionRepository;
import com.quickbooks.repository.SubscriptionPlanRepository;
import com.quickbooks.repository.TaxRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class SubscriberSubscriptionService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;
    private final SubscriberRepository subscriberRepository;
    private final TaxRepository taxRepository;
    private final DiscountRepository discountRepository;

    public SubscriberSubscriptionService(SubscriptionPlanRepository subscriptionPlanRepository,
                                           SubscriberSubscriptionRepository subscriberSubscriptionRepository,
                                           SubscriberRepository subscriberRepository,
                                           TaxRepository taxRepository,
                                           DiscountRepository discountRepository) {
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
        this.subscriberRepository = subscriberRepository;
        this.taxRepository = taxRepository;
        this.discountRepository = discountRepository;
    }

    @Transactional
    public SubscriptionStatus syncSubscriptionStatus(Long subscriberId) {
        Subscriber subscriber = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found"));
        LocalDate today = LocalDate.now();

        subscriberSubscriptionRepository
                .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(subscriberId, SubscriptionRecordStatus.ACTIVE)
                .ifPresent(activeRecord -> {
                    if (activeRecord.getEndDate().isBefore(today)) {
                        activeRecord.setStatus(SubscriptionRecordStatus.EXPIRED);
                        subscriberSubscriptionRepository.save(activeRecord);
                        subscriber.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
                    } else {
                        subscriber.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                    }
                });

        if (subscriber.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            boolean hasValidActive = subscriberSubscriptionRepository
                    .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(subscriberId, SubscriptionRecordStatus.ACTIVE)
                    .map(record -> !record.getEndDate().isBefore(today))
                    .orElse(false);
            if (!hasValidActive) {
                subscriber.setSubscriptionStatus(
                        subscriberSubscriptionRepository.findFirstBySubscriber_IdOrderByEndDateDesc(subscriberId).isPresent()
                                ? SubscriptionStatus.EXPIRED
                                : SubscriptionStatus.NONE
                );
            }
        }

        subscriberRepository.save(subscriber);
        return subscriber.getSubscriptionStatus();
    }

    @Transactional
    public List<SubscriberPlanOptionResponse> listAvailablePlans(Long subscriberId) {
        syncSubscriptionStatus(subscriberId);
        return subscriptionPlanRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(plan -> toPlanOption(subscriberId, plan))
                .toList();
    }

    @Transactional
    public SubscriberSubscriptionInfo getCurrentSubscription(Long subscriberId) {
        SubscriptionStatus status = syncSubscriptionStatus(subscriberId);
        if (status == SubscriptionStatus.ACTIVE) {
            return subscriberSubscriptionRepository
                    .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(subscriberId, SubscriptionRecordStatus.ACTIVE)
                    .map(SubscriberSubscriptionInfo::from)
                    .orElse(null);
        }
        if (status == SubscriptionStatus.EXPIRED) {
            return subscriberSubscriptionRepository.findFirstBySubscriber_IdOrderByEndDateDesc(subscriberId)
                    .map(SubscriberSubscriptionInfo::from)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public SubscribeResponse subscribe(Long subscriberId, SubscribeRequest request) {
        SubscriptionStatus status = syncSubscriptionStatus(subscriberId);
        if (status == SubscriptionStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active subscription");
        }

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .filter(SubscriptionPlan::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription plan not found"));

        Subscriber subscriber = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found"));
        PricingBreakdown pricing = calculatePricing(subscriberId, plan);
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = calculateEndDate(startDate, plan.getDuration());

        subscriberSubscriptionRepository
                .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(subscriberId, SubscriptionRecordStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(SubscriptionRecordStatus.EXPIRED);
                    subscriberSubscriptionRepository.save(existing);
                });

        SubscriberSubscription subscription = new SubscriberSubscription();
        subscription.setSubscriber(subscriber);
        subscription.setPlan(plan);
        subscription.setDiscount(pricing.discount().orElse(null));
        subscription.setTaxAmount(pricing.taxAmount());
        subscription.setTotalAmount(pricing.totalAmount());
        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setStatus(SubscriptionRecordStatus.ACTIVE);

        SubscriberSubscription saved = subscriberSubscriptionRepository.save(subscription);
        subscriber.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        subscriberRepository.save(subscriber);

        SubscribeResponse response = new SubscribeResponse();
        response.setSubscription(SubscriberSubscriptionInfo.from(saved));
        response.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        response.setRequiresSubscription(false);
        return response;
    }

    private SubscriberPlanOptionResponse toPlanOption(Long subscriberId, SubscriptionPlan plan) {
        PricingBreakdown pricing = calculatePricing(subscriberId, plan);
        return SubscriberPlanOptionResponse.from(
                plan,
                pricing.discountAmount(),
                pricing.discountName(),
                pricing.taxAmount(),
                pricing.totalAmount()
        );
    }

    private PricingBreakdown calculatePricing(Long subscriberId, SubscriptionPlan plan) {
        BigDecimal price = plan.getPrice();
        Optional<Discount> discount = findBestDiscount(subscriberId, plan.getId(), price);
        BigDecimal discountAmount = discount.map(d -> calculateDiscountAmount(price, d)).orElse(BigDecimal.ZERO);
        BigDecimal discountedPrice = price.subtract(discountAmount).max(BigDecimal.ZERO);

        BigDecimal taxAmount = taxRepository.findActiveByPlanId(plan.getId()).stream()
                .map(tax -> discountedPrice.multiply(tax.getRate())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = discountedPrice.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        return new PricingBreakdown(
                discount,
                discountAmount.setScale(2, RoundingMode.HALF_UP),
                discount.map(Discount::getName).orElse(null),
                taxAmount.setScale(2, RoundingMode.HALF_UP),
                totalAmount
        );
    }

    private Optional<Discount> findBestDiscount(Long subscriberId, Long planId, BigDecimal price) {
        return discountRepository.findApplicableForSubscriberAndPlan(subscriberId, planId, LocalDate.now()).stream()
                .max(Comparator.comparing(d -> calculateDiscountAmount(price, d)));
    }

    private BigDecimal calculateDiscountAmount(BigDecimal price, Discount discount) {
        if (discount.getType() == DiscountType.PERCENTAGE) {
            return price.multiply(discount.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return discount.getValue().min(price);
    }

    private LocalDate calculateEndDate(LocalDate startDate, PlanDuration duration) {
        return switch (duration) {
            case MONTHLY -> startDate.plusMonths(1);
            case QUARTERLY -> startDate.plusMonths(3);
            case HALF_YEARLY -> startDate.plusMonths(6);
            case ANNUAL -> startDate.plusYears(1);
        };
    }

    private record PricingBreakdown(
            Optional<Discount> discount,
            BigDecimal discountAmount,
            String discountName,
            BigDecimal taxAmount,
            BigDecimal totalAmount
    ) {}
}
