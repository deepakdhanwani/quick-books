package com.quickbooks.repository;

import com.quickbooks.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findBySubscriberIdAndActiveTrueOrderByNameAsc(Long subscriberId);

    Optional<Company> findByIdAndSubscriberIdAndActiveTrue(Long id, Long subscriberId);

    Optional<Company> findFirstBySubscriberIdAndActiveTrueOrderByCreatedAtAsc(Long subscriberId);

    boolean existsBySubscriberIdAndNameIgnoreCase(Long subscriberId, String name);

    long countBySubscriberIdAndActiveTrue(Long subscriberId);
}
