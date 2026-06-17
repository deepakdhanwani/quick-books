package com.quickbooks.repository;

import com.quickbooks.entity.Payment;
import com.quickbooks.entity.enums.PaymentType;
import com.quickbooks.entity.enums.ReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

    @Query("""
            SELECT p FROM Payment p
            WHERE p.subscriber.id = :subscriberId
            AND p.referenceType = com.quickbooks.entity.enums.ReferenceType.SALE
            AND p.referenceId IN :saleIds
            AND p.type = com.quickbooks.entity.enums.PaymentType.RECEIVED
            ORDER BY p.date ASC, p.id ASC
            """)
    List<Payment> findReceivedBySaleIds(
            @Param("subscriberId") Long subscriberId,
            @Param("saleIds") Collection<Long> saleIds);

    @Query("""
            SELECT p FROM Payment p
            WHERE p.subscriber.id = :subscriberId
            AND p.referenceType = com.quickbooks.entity.enums.ReferenceType.PURCHASE
            AND p.referenceId IN :purchaseIds
            AND p.type = com.quickbooks.entity.enums.PaymentType.PAID
            ORDER BY p.date ASC, p.id ASC
            """)
    List<Payment> findPaidByPurchaseIds(
            @Param("subscriberId") Long subscriberId,
            @Param("purchaseIds") Collection<Long> purchaseIds);

    @Query("""
            SELECT COALESCE(SUM(p.amount), 0), COALESCE(SUM(COALESCE(p.adjustedAmount, 0)), 0), COUNT(p)
            FROM Payment p
            JOIN Sale s ON p.referenceType = com.quickbooks.entity.enums.ReferenceType.SALE
                AND p.referenceId = s.id
            WHERE p.subscriber.id = :subscriberId
            AND s.customer.id = :customerId
            AND p.type = com.quickbooks.entity.enums.PaymentType.RECEIVED
            """)
    List<Object[]> aggregateReceivedByCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("customerId") Long customerId);

    @Query("""
            SELECT COALESCE(SUM(p.amount), 0), COALESCE(SUM(COALESCE(p.adjustedAmount, 0)), 0), COUNT(p)
            FROM Payment p
            JOIN Purchase pu ON p.referenceType = com.quickbooks.entity.enums.ReferenceType.PURCHASE
                AND p.referenceId = pu.id
            WHERE p.subscriber.id = :subscriberId
            AND pu.vendor.id = :vendorId
            AND p.type = com.quickbooks.entity.enums.PaymentType.PAID
            """)
    List<Object[]> aggregatePaidByVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId);
}
