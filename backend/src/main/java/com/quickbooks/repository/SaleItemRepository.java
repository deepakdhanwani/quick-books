package com.quickbooks.repository;

import com.quickbooks.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Query("""
            SELECT COALESCE(p.name, si.description), COALESCE(SUM(si.quantity), 0), COALESCE(SUM(si.amount), 0)
            FROM SaleItem si
            JOIN si.sale s
            LEFT JOIN si.product p
            WHERE s.subscriber.id = :subscriberId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            GROUP BY COALESCE(p.id, 0L), COALESCE(p.name, si.description)
            ORDER BY SUM(si.amount) DESC
            """)
    List<Object[]> findTopProductsBySales(
            @Param("subscriberId") Long subscriberId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT COALESCE(p.name, si.description), COALESCE(SUM(si.quantity), 0), COALESCE(SUM(si.amount), 0)
            FROM SaleItem si
            JOIN si.sale s
            LEFT JOIN si.product p
            WHERE s.subscriber.id = :subscriberId
            AND s.company.id = :companyId
            AND s.date >= :fromDate
            AND s.date <= :toDate
            GROUP BY COALESCE(p.id, 0L), COALESCE(p.name, si.description)
            ORDER BY SUM(si.amount) DESC
            """)
    List<Object[]> findTopProductsBySales(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
}
