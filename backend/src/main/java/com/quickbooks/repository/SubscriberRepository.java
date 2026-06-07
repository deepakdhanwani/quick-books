package com.quickbooks.repository;

import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {
    Optional<Subscriber> findByPhone(String phone);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByBusinessType_Id(Long businessTypeId);

    List<Subscriber> findByActiveTrueOrderByBusinessNameAsc();

    long countByActiveTrue();

    long countBySubscriptionStatus(SubscriptionStatus subscriptionStatus);

    List<Subscriber> findBySubscriptionStatusOrderByBusinessNameAsc(SubscriptionStatus subscriptionStatus);

    List<Subscriber> findByLoginPinIsNull();
}
