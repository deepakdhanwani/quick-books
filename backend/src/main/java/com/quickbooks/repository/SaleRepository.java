package com.quickbooks.repository;

import com.quickbooks.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("""
            SELECT s FROM Sale s
            LEFT JOIN s.customer c
            WHERE s.subscriber.id = :subscriberId
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
            """)
    Page<Sale> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("search") String search,
            @Param("paymentFilter") String paymentFilter,
            Pageable pageable);

    @Query("""
            SELECT s FROM Sale s
            JOIN FETCH s.customer
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.product
            WHERE s.id = :id AND s.subscriber.id = :subscriberId
            """)
    Optional<Sale> findByIdAndSubscriberId(@Param("id") Long id, @Param("subscriberId") Long subscriberId);

    boolean existsBySubscriberIdAndInvoiceNumberIgnoreCase(Long subscriberId, String invoiceNumber);

    boolean existsBySubscriberIdAndInvoiceNumberIgnoreCaseAndIdNot(Long subscriberId, String invoiceNumber, Long id);

    Optional<Sale> findFirstBySubscriber_IdOrderByIdDesc(Long subscriberId);

    @Query("""
            SELECT s FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.customer.id = :customerId
            AND (
                :paymentFilter = 'ALL'
                OR (:paymentFilter = 'PENDING' AND s.paymentStatus <> 'PAID')
                OR (:paymentFilter = 'PAID' AND s.paymentStatus = 'PAID')
            )
            """)
    Page<Sale> findBySubscriberAndCustomer(
            @Param("subscriberId") Long subscriberId,
            @Param("customerId") Long customerId,
            @Param("paymentFilter") String paymentFilter,
            Pageable pageable);

    @Query("""
            SELECT s.customer.id, COALESCE(SUM(s.pendingAmount), 0)
            FROM Sale s
            WHERE s.subscriber.id = :subscriberId
            AND s.customer.id IN :customerIds
            AND s.pendingAmount > 0
            GROUP BY s.customer.id
            """)
    List<Object[]> sumPendingAmountsByCustomerIds(
            @Param("subscriberId") Long subscriberId,
            @Param("customerIds") Collection<Long> customerIds);
}
