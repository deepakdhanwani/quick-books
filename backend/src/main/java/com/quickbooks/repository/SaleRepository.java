package com.quickbooks.repository;

import com.quickbooks.entity.Sale;
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

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("""
            SELECT s FROM Sale s
            LEFT JOIN s.customer c
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(COALESCE(s.invoiceNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (
                :paymentFilter = 'ALL'
                OR (:paymentFilter = 'PENDING' AND s.paymentStatus <> 'PAID')
                OR (:paymentFilter = 'PAID' AND s.paymentStatus = 'PAID')
            )
            AND s.date >= COALESCE(:fromDate, s.date)
            AND s.date <= COALESCE(:toDate, s.date)
            """)
    Page<Sale> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("paymentFilter") String paymentFilter,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("""
            SELECT s FROM Sale s
            JOIN FETCH s.customer
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.product
            WHERE s.id = :id AND s.subscriber.id = :subscriberId AND s.company.id = :companyId
            """)
    Optional<Sale> findByIdAndSubscriberIdAndCompanyId(@Param("id") Long id, @Param("subscriberId") Long subscriberId, @Param("companyId") Long companyId);
    Optional<Sale> findByIdAndSubscriberId(@Param("id") Long id, @Param("subscriberId") Long subscriberId);

    boolean existsBySubscriberIdAndCompanyIdAndInvoiceNumberIgnoreCase(Long subscriberId, Long companyId, String invoiceNumber);
    boolean existsBySubscriberIdAndInvoiceNumberIgnoreCase(Long subscriberId, String invoiceNumber);

    boolean existsBySubscriberIdAndCompanyIdAndInvoiceNumberIgnoreCaseAndIdNot(Long subscriberId, Long companyId, String invoiceNumber, Long id);
    boolean existsBySubscriberIdAndInvoiceNumberIgnoreCaseAndIdNot(Long subscriberId, String invoiceNumber, Long id);

    Optional<Sale> findFirstBySubscriber_IdAndCompany_IdOrderByIdDesc(Long subscriberId, Long companyId);
    Optional<Sale> findFirstBySubscriber_IdOrderByIdDesc(Long subscriberId);

    @Query("""
            SELECT s FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id = :customerId
            AND (
                :paymentFilter = 'ALL'
                OR (:paymentFilter = 'PENDING' AND s.paymentStatus <> 'PAID')
                OR (:paymentFilter = 'PAID' AND s.paymentStatus = 'PAID')
            )
            """)
    Page<Sale> findBySubscriberAndCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerId") Long customerId,
            @Param("paymentFilter") String paymentFilter,
            Pageable pageable);

    @Query("""
            SELECT s.customer.id, COALESCE(SUM(s.pendingAmount), 0)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id IN :customerIds
            AND s.pendingAmount > 0
            GROUP BY s.customer.id
            """)
    List<Object[]> sumPendingAmountsByCustomerIds(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerIds") Collection<Long> customerIds);

    long countBySubscriber_IdAndCompany_Id(Long subscriberId, Long companyId);
    long countBySubscriber_Id(Long subscriberId);

    @Query("""
            SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.date >= COALESCE(:fromDate, s.date)
            AND s.date <= COALESCE(:toDate, s.date)
            """)
    BigDecimal sumNetAmountBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
    @Query("""
            SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.date >= COALESCE(:fromDate, s.date)
            AND s.date <= COALESCE(:toDate, s.date)
            """)
    BigDecimal sumNetAmountBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT COALESCE(SUM(s.pendingAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.pendingAmount > 0
            """)
    BigDecimal sumPendingAmountBySubscriber(@Param("subscriberId") Long subscriberId, @Param("companyId") Long companyId);
    @Query("""
            SELECT COALESCE(SUM(s.pendingAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.pendingAmount > 0
            """)
    BigDecimal sumPendingAmountBySubscriber(@Param("subscriberId") Long subscriberId);

    @Query("""
            SELECT s.date, s.totalAmount FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            ORDER BY s.date ASC
            """)
    List<Object[]> findAmountsByDateRange(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
    @Query("""
            SELECT s.date, s.totalAmount FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            ORDER BY s.date ASC
            """)
    List<Object[]> findAmountsByDateRange(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT s.customer.name, COALESCE(SUM(s.pendingAmount), 0)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.pendingAmount > 0
            GROUP BY s.customer.id, s.customer.name
            ORDER BY SUM(s.pendingAmount) DESC
            """)
    List<Object[]> findTopReceivablesBySubscriber(@Param("subscriberId") Long subscriberId, @Param("companyId") Long companyId);

    @Query("""
            SELECT s.customer.name, COALESCE(SUM(s.pendingAmount), 0), COUNT(s)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.pendingAmount > 0
            GROUP BY s.customer.id, s.customer.name
            ORDER BY SUM(s.pendingAmount) DESC
            """)
    List<Object[]> findReceivableDetailsBySubscriber(@Param("subscriberId") Long subscriberId, @Param("companyId") Long companyId);

    @Query("""
            SELECT s.customer.name, COUNT(s), COALESCE(SUM(s.totalAmount), 0)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            GROUP BY s.customer.id, s.customer.name
            ORDER BY SUM(s.totalAmount) DESC
            """)
    List<Object[]> findCustomerSalesByPeriod(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT COUNT(s), COALESCE(SUM(s.totalAmount), 0), COALESCE(AVG(s.totalAmount), 0)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            """)
    List<Object[]> aggregateSalesPerformance(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT s FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id = :customerId
            ORDER BY s.date ASC, s.id ASC
            """)
    List<Sale> findAllBySubscriberAndCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerId") Long customerId);

    @Query("""
            SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id = :customerId
            """)
    BigDecimal sumTotalAmountByCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerId") Long customerId);

    @Query("""
            SELECT COALESCE(SUM(s.pendingAmount), 0) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id = :customerId
            """)
    BigDecimal sumPendingAmountByCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerId") Long customerId);

    @Query("""
            SELECT COUNT(s) FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.customer.id = :customerId
            """)
    long countBySubscriberAndCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("customerId") Long customerId);
}
