package com.quickbooks.repository;

import com.quickbooks.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
