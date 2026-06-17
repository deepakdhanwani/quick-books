package com.quickbooks.repository;

import com.quickbooks.entity.SubscriberUserCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubscriberUserCompanyRepository extends JpaRepository<SubscriberUserCompany, SubscriberUserCompany.SubscriberUserCompanyId> {

    List<SubscriberUserCompany> findBySubscriberUserIdOrderByCompanyIdAsc(Long subscriberUserId);

    @Modifying
    @Query("DELETE FROM SubscriberUserCompany suc WHERE suc.subscriberUserId = :subscriberUserId")
    void deleteBySubscriberUserId(@Param("subscriberUserId") Long subscriberUserId);
}
