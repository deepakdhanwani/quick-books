package com.quickbooks.repository;

import com.quickbooks.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("""
            SELECT c FROM Customer c
            WHERE c.subscriber.id = :subscriberId
            AND c.company.id = :companyId
            AND (:active IS NULL OR c.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.businessName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.gstNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Customer> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
    @Query("""
            SELECT c FROM Customer c
            WHERE c.subscriber.id = :subscriberId
            AND (:active IS NULL OR c.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.businessName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(c.gstNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Customer> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);

    Optional<Customer> findByIdAndSubscriberIdAndCompanyId(Long id, Long subscriberId, Long companyId);
    Optional<Customer> findByIdAndSubscriberId(Long id, Long subscriberId);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCase(Long subscriberId, Long companyId, String name);
    boolean existsBySubscriberIdAndNameIgnoreCase(Long subscriberId, String name);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCaseAndIdNot(Long subscriberId, Long companyId, String name, Long id);
    boolean existsBySubscriberIdAndNameIgnoreCaseAndIdNot(Long subscriberId, String name, Long id);

    long countBySubscriber_IdAndCompany_Id(Long subscriberId, Long companyId);
    long countBySubscriber_Id(Long subscriberId);
}
