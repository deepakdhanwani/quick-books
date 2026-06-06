package com.quickbooks.repository;

import com.quickbooks.entity.SubscriberSubscription;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriberSubscriptionRepository extends JpaRepository<SubscriberSubscription, Long> {
    Optional<SubscriberSubscription> findFirstBySubscriberIdAndStatusOrderByEndDateDesc(
            Long subscriberId, SubscriptionRecordStatus status);

    Optional<SubscriberSubscription> findFirstBySubscriber_IdOrderByEndDateDesc(Long subscriberId);

    List<SubscriberSubscription> findBySubscriber_IdOrderByCreatedAtDesc(Long subscriberId);

    boolean existsByPlan_Id(Long planId);

    boolean existsByDiscount_Id(Long discountId);

    long countByStatus(SubscriptionRecordStatus status);

    @Query("""
            SELECT COALESCE(SUM(ss.totalAmount), 0)
            FROM SubscriberSubscription ss
            WHERE ss.createdAt >= :from AND ss.createdAt < :to
            """)
    BigDecimal sumTotalAmountBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("""
            SELECT ss FROM SubscriberSubscription ss
            JOIN FETCH ss.subscriber s
            JOIN FETCH ss.plan p
            LEFT JOIN FETCH s.businessType
            WHERE ss.createdAt >= :from AND ss.createdAt < :to
            AND (:planId IS NULL OR p.id = :planId)
            AND (:businessTypeId IS NULL OR s.businessType.id = :businessTypeId)
            ORDER BY ss.createdAt DESC
            """)
    List<SubscriberSubscription> findRevenueRecords(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("planId") Long planId,
            @Param("businessTypeId") Long businessTypeId);

    @Query("""
            SELECT ss FROM SubscriberSubscription ss
            JOIN FETCH ss.subscriber s
            JOIN FETCH ss.plan p
            LEFT JOIN FETCH s.businessType
            WHERE ss.status = com.quickbooks.entity.enums.SubscriptionRecordStatus.ACTIVE
            AND ss.endDate BETWEEN :fromDate AND :toDate
            ORDER BY ss.endDate ASC
            """)
    List<SubscriberSubscription> findExpiringBetween(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT ss FROM SubscriberSubscription ss
            JOIN FETCH ss.subscriber s
            LEFT JOIN FETCH s.businessType
            WHERE ss.createdAt >= :from AND ss.createdAt < :to
            """)
    List<SubscriberSubscription> findRecordsBetween(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);
}
