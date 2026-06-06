package com.quickbooks.repository;

import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriberSubscriptionRepository extends JpaRepository<SubscriberSubscription, Long> {
    Optional<SubscriberSubscription> findFirstBySubscriberIdAndStatusOrderByEndDateDesc(
            Long subscriberId, SubscriptionRecordStatus status);

    Optional<SubscriberSubscription> findFirstBySubscriber_IdOrderByEndDateDesc(Long subscriberId);

    List<SubscriberSubscription> findBySubscriber_IdOrderByCreatedAtDesc(Long subscriberId);

    boolean existsByPlan_Id(Long planId);
}
