package com.quickbooks.repository;

import com.quickbooks.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    @Query("""
            SELECT p FROM Purchase p
            LEFT JOIN p.vendor v
            WHERE p.subscriber.id = :subscriberId
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(COALESCE(p.billNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(v.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (
                :paymentFilter = 'ALL'
                OR (:paymentFilter = 'PENDING' AND p.paymentStatus <> 'PAID')
                OR (:paymentFilter = 'PAID' AND p.paymentStatus = 'PAID')
            )
            AND p.date >= COALESCE(:fromDate, p.date)
            AND p.date <= COALESCE(:toDate, p.date)
            """)
    Page<Purchase> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("search") String search,
            @Param("paymentFilter") String paymentFilter,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("""
            SELECT p FROM Purchase p
            JOIN FETCH p.vendor
            LEFT JOIN FETCH p.items i
            LEFT JOIN FETCH i.product
            WHERE p.id = :id AND p.subscriber.id = :subscriberId
            """)
    Optional<Purchase> findByIdAndSubscriberId(@Param("id") Long id, @Param("subscriberId") Long subscriberId);

    boolean existsBySubscriberIdAndBillNumberIgnoreCase(Long subscriberId, String billNumber);

    boolean existsBySubscriberIdAndBillNumberIgnoreCaseAndIdNot(Long subscriberId, String billNumber, Long id);

    Optional<Purchase> findFirstBySubscriber_IdOrderByIdDesc(Long subscriberId);

    @Query("""
            SELECT p FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id = :vendorId
            AND (
                :paymentFilter = 'ALL'
                OR (:paymentFilter = 'PENDING' AND p.paymentStatus <> 'PAID')
                OR (:paymentFilter = 'PAID' AND p.paymentStatus = 'PAID')
            )
            """)
    Page<Purchase> findBySubscriberAndVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId,
            @Param("paymentFilter") String paymentFilter,
            Pageable pageable);

    @Query("""
            SELECT p.vendor.id, COALESCE(SUM(p.pendingAmount), 0)
            FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id IN :vendorIds
            AND p.pendingAmount > 0
            GROUP BY p.vendor.id
            """)
    List<Object[]> sumPendingAmountsByVendorIds(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorIds") Collection<Long> vendorIds);

    long countBySubscriber_Id(Long subscriberId);
}
