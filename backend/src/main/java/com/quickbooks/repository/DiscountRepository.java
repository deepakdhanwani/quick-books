package com.quickbooks.repository;

import com.quickbooks.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            SELECT DISTINCT d FROM Discount d
            JOIN d.applicablePlans p
            LEFT JOIN d.specificSubscribers s
            WHERE d.active = true
            AND p.id = :planId
            AND (d.scope = com.quickbooks.entity.enums.DiscountScope.ALL OR s.id = :subscriberId)
            AND (d.validFrom IS NULL OR d.validFrom <= :today)
            AND (d.validTo IS NULL OR d.validTo >= :today)
            """)
    List<Discount> findApplicableForSubscriberAndPlan(
            @Param("subscriberId") Long subscriberId,
            @Param("planId") Long planId,
            @Param("today") LocalDate today);
}
