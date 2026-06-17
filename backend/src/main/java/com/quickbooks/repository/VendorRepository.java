package com.quickbooks.repository;

import com.quickbooks.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    @Query("""
            SELECT v FROM Vendor v
            WHERE v.subscriber.id = :subscriberId
            AND v.company.id = :companyId
            AND (:active IS NULL OR v.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(v.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.businessName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.contactPerson, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.gstNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Vendor> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
    @Query("""
            SELECT v FROM Vendor v
            WHERE v.subscriber.id = :subscriberId
            AND (:active IS NULL OR v.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(v.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.businessName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.contactPerson, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(v.gstNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Vendor> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);

    Optional<Vendor> findByIdAndSubscriberIdAndCompanyId(Long id, Long subscriberId, Long companyId);
    Optional<Vendor> findByIdAndSubscriberId(Long id, Long subscriberId);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCase(Long subscriberId, Long companyId, String name);
    boolean existsBySubscriberIdAndNameIgnoreCase(Long subscriberId, String name);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCaseAndIdNot(Long subscriberId, Long companyId, String name, Long id);
    boolean existsBySubscriberIdAndNameIgnoreCaseAndIdNot(Long subscriberId, String name, Long id);

    long countBySubscriber_IdAndCompany_Id(Long subscriberId, Long companyId);
    long countBySubscriber_Id(Long subscriberId);
}
