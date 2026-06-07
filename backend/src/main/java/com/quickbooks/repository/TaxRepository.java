package com.quickbooks.repository;

import com.quickbooks.entity.Tax;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaxRepository extends JpaRepository<Tax, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            SELECT t FROM Tax t JOIN t.applicablePlans p
            WHERE t.active = true AND p.id = :planId
            """)
    List<Tax> findActiveByPlanId(@Param("planId") Long planId);
}
