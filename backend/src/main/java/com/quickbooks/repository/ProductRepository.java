package com.quickbooks.repository;

import com.quickbooks.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            SELECT p FROM Product p
            WHERE p.subscriber.id = :subscriberId
            AND p.company.id = :companyId
            AND (:active IS NULL OR p.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Product> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
    @Query("""
            SELECT p FROM Product p
            WHERE p.subscriber.id = :subscriberId
            AND (:active IS NULL OR p.active = :active)
            AND (
                :search IS NULL OR :search = ''
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<Product> findBySubscriber(
            @Param("subscriberId") Long subscriberId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);

    Optional<Product> findByIdAndSubscriberIdAndCompanyId(Long id, Long subscriberId, Long companyId);
    Optional<Product> findByIdAndSubscriberId(Long id, Long subscriberId);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCase(Long subscriberId, Long companyId, String name);
    boolean existsBySubscriberIdAndNameIgnoreCase(Long subscriberId, String name);

    boolean existsBySubscriberIdAndCompanyIdAndNameIgnoreCaseAndIdNot(Long subscriberId, Long companyId, String name, Long id);
    boolean existsBySubscriberIdAndNameIgnoreCaseAndIdNot(Long subscriberId, String name, Long id);

    long countBySubscriber_IdAndCompany_Id(Long subscriberId, Long companyId);
    long countBySubscriber_Id(Long subscriberId);
}
