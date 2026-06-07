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

    Optional<Product> findByIdAndSubscriberId(Long id, Long subscriberId);

    boolean existsBySubscriberIdAndNameIgnoreCase(Long subscriberId, String name);

    boolean existsBySubscriberIdAndNameIgnoreCaseAndIdNot(Long subscriberId, String name, Long id);

    long countBySubscriber_Id(Long subscriberId);
}
