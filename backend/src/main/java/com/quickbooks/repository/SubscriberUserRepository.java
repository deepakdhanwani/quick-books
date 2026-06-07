package com.quickbooks.repository;

import com.quickbooks.entity.SubscriberUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriberUserRepository extends JpaRepository<SubscriberUser, Long> {

    List<SubscriberUser> findBySubscriberIdOrderByNameAsc(Long subscriberId);

    Optional<SubscriberUser> findByIdAndSubscriberId(Long id, Long subscriberId);

    List<SubscriberUser> findBySubscriberIdAndActiveTrue(Long subscriberId);
}
