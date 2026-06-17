package com.quickbooks.repository;

import com.quickbooks.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    @Query("""
            SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.date >= COALESCE(:fromDate, p.date)
            AND p.date <= COALESCE(:toDate, p.date)
            """)
    BigDecimal sumNetAmountBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT COALESCE(SUM(p.pendingAmount), 0) FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.pendingAmount > 0
            """)
    BigDecimal sumPendingAmountBySubscriber(@Param("subscriberId") Long subscriberId);

    @Query("""
            SELECT p.date, p.totalAmount FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.date >= :fromDate
            AND p.date <= :toDate
            ORDER BY p.date ASC
            """)
    List<Object[]> findAmountsByDateRange(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT p.vendor.name, COALESCE(SUM(p.pendingAmount), 0)
            FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.pendingAmount > 0
            GROUP BY p.vendor.id, p.vendor.name
            ORDER BY SUM(p.pendingAmount) DESC
            """)
    List<Object[]> findTopPayablesBySubscriber(@Param("subscriberId") Long subscriberId);

    @Query("""
            SELECT p.vendor.name, COALESCE(SUM(p.pendingAmount), 0), COUNT(p)
            FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.pendingAmount > 0
            GROUP BY p.vendor.id, p.vendor.name
            ORDER BY SUM(p.pendingAmount) DESC
            """)
    List<Object[]> findPayableDetailsBySubscriber(@Param("subscriberId") Long subscriberId);

    @Query("""
            SELECT p.vendor.name, COUNT(p), COALESCE(SUM(p.totalAmount), 0)
            FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.date >= :fromDate
            AND p.date <= :toDate
            GROUP BY p.vendor.id, p.vendor.name
            ORDER BY SUM(p.totalAmount) DESC
            """)
    List<Object[]> findVendorPurchasesByPeriod(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT COUNT(p), COALESCE(SUM(p.totalAmount), 0), COALESCE(AVG(p.totalAmount), 0)
            FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.date >= :fromDate
            AND p.date <= :toDate
            """)
    List<Object[]> aggregatePurchasePerformance(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT p FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id = :vendorId
            ORDER BY p.date ASC, p.id ASC
            """)
    List<Purchase> findAllBySubscriberAndVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId);

    @Query("""
            SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id = :vendorId
            """)
    BigDecimal sumTotalAmountByVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId);

    @Query("""
            SELECT COALESCE(SUM(p.pendingAmount), 0) FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id = :vendorId
            """)
    BigDecimal sumPendingAmountByVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId);

    @Query("""
            SELECT COUNT(p) FROM Purchase p
            WHERE p.subscriber.id = :subscriberId
            AND p.vendor.id = :vendorId
            """)
    long countBySubscriberAndVendor(
            @Param("subscriberId") Long subscriberId,
            @Param("vendorId") Long vendorId);
}
