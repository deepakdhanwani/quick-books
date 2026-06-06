package com.quickbooks.repository;

import com.quickbooks.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findByActiveTrueOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM tax_plans WHERE plan_id = :planId)", nativeQuery = true)
    boolean existsInTaxAssignments(@Param("planId") Long planId);
}
