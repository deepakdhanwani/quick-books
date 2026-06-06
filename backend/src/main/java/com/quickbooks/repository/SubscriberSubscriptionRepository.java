package com.quickbooks.repository;

import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubscriberSubscriptionRepository extends JpaRepository<SubscriberSubscription, Long> {
    Optional<SubscriberSubscription> findFirstBySubscriberIdAndStatusOrderByEndDateDesc(
            Long subscriberId, SubscriptionRecordStatus status);
}
