package com.quickbooks.repository;

import com.quickbooks.entity.Payment;
import com.quickbooks.entity.enums.PaymentType;
import com.quickbooks.entity.enums.ReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
            SELECT p FROM Payment p
            WHERE p.subscriber.id = :subscriberId
            AND p.referenceType = :referenceType
            AND p.referenceId = :referenceId
            AND p.type = :paymentType
            ORDER BY p.createdAt DESC
            """)
    List<Payment> findBySale(
            @Param("subscriberId") Long subscriberId,
            @Param("referenceType") ReferenceType referenceType,
            @Param("referenceId") Long referenceId,
            @Param("paymentType") PaymentType paymentType);

    Optional<Payment> findByIdAndSubscriberId(Long id, Long subscriberId);
}
