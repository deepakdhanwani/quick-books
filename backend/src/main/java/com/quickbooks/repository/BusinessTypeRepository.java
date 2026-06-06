package com.quickbooks.repository;

import com.quickbooks.entity.BusinessType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BusinessTypeRepository extends JpaRepository<BusinessType, Long> {
    List<BusinessType> findByActiveTrueOrderByNameAsc();
    List<BusinessType> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<BusinessType> findByNameIgnoreCase(String name);
}
