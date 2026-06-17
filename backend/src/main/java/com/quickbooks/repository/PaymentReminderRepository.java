package com.quickbooks.repository;

import com.quickbooks.entity.PaymentReminder;
import com.quickbooks.entity.enums.PaymentReminderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentReminderRepository extends JpaRepository<PaymentReminder, Long> {

    Optional<PaymentReminder> findByIdAndSubscriberIdAndCompanyId(Long id, Long subscriberId, Long companyId);

    @Query("""
            SELECT r FROM PaymentReminder r
            JOIN FETCH r.customer
            LEFT JOIN FETCH r.sale
            WHERE r.subscriber.id = :subscriberId
            AND r.company.id = :companyId
            AND r.status IN :statuses
            ORDER BY r.promisedDate ASC, r.id ASC
            """)
    List<PaymentReminder> findActiveBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("statuses") List<PaymentReminderStatus> statuses);

    @Query("""
            SELECT r FROM PaymentReminder r
            JOIN FETCH r.customer
            LEFT JOIN FETCH r.sale
            WHERE r.subscriber.id = :subscriberId
            AND r.company.id = :companyId
            AND r.status IN :statuses
            """)
    Page<PaymentReminder> findBySubscriberAndStatuses(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("statuses") List<PaymentReminderStatus> statuses,
            Pageable pageable);

    @Query("""
            SELECT r FROM PaymentReminder r
            JOIN FETCH r.customer
            LEFT JOIN FETCH r.sale
            WHERE r.subscriber.id = :subscriberId
            AND r.company.id = :companyId
            AND r.status IN :statuses
            """)
    Page<PaymentReminder> findPastBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("statuses") List<PaymentReminderStatus> statuses,
            Pageable pageable);

    @Query("""
            SELECT r FROM PaymentReminder r
            JOIN FETCH r.customer
            LEFT JOIN FETCH r.sale
            WHERE r.subscriber.id = :subscriberId
            AND r.company.id = :companyId
            """)
    Page<PaymentReminder> findAllBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            Pageable pageable);

    @Query("""
            SELECT r FROM PaymentReminder r
            JOIN FETCH r.customer
            LEFT JOIN FETCH r.sale
            WHERE r.id = :id AND r.subscriber.id = :subscriberId AND r.company.id = :companyId
            """)
    Optional<PaymentReminder> findDetailedByIdAndSubscriberId(
            @Param("id") Long id,
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId);
}
