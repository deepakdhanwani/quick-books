package com.quickbooks.repository;

import com.quickbooks.entity.RequestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {

    @Query("""
            SELECT r FROM RequestLog r
            WHERE (:subscriberId IS NULL OR r.subscriberId = :subscriberId)
              AND (:companyId IS NULL OR r.companyId = :companyId)
              AND (:userRole IS NULL OR r.userRole = :userRole)
              AND (:errorsOnly = false OR r.statusCode >= 400)
              AND (:slowOnly = false OR r.durationMs >= :slowThresholdMs)
              AND (:pathPattern IS NULL OR LOWER(r.path) LIKE :pathPattern)
              AND r.createdAt >= :from
              AND r.createdAt <= :to
            ORDER BY r.createdAt DESC
            """)
    Page<RequestLog> search(
            @Param("subscriberId") Long subscriberId,
            @Param("companyId") Long companyId,
            @Param("userRole") String userRole,
            @Param("errorsOnly") boolean errorsOnly,
            @Param("slowOnly") boolean slowOnly,
            @Param("slowThresholdMs") long slowThresholdMs,
            @Param("pathPattern") String pathPattern,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable);

    @Query("""
            SELECT COUNT(r) FROM RequestLog r
            WHERE r.createdAt >= :from AND r.createdAt <= :to
            """)
    long countInWindow(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("""
            SELECT COUNT(r) FROM RequestLog r
            WHERE r.createdAt >= :from AND r.createdAt <= :to AND r.statusCode >= 400
            """)
    long countErrorsInWindow(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("""
            SELECT COUNT(r) FROM RequestLog r
            WHERE r.createdAt >= :from AND r.createdAt <= :to AND r.durationMs >= :slowThresholdMs
            """)
    long countSlowInWindow(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("slowThresholdMs") long slowThresholdMs);

    @Query("""
            SELECT COALESCE(AVG(r.durationMs), 0) FROM RequestLog r
            WHERE r.createdAt >= :from AND r.createdAt <= :to
            """)
    double avgDurationInWindow(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("""
            SELECT COALESCE(MAX(r.durationMs), 0) FROM RequestLog r
            WHERE r.createdAt >= :from AND r.createdAt <= :to
            """)
    long maxDurationInWindow(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query(value = """
            SELECT method, path, COUNT(*) AS request_count,
                   AVG(duration_ms) AS avg_duration_ms,
                   MAX(duration_ms) AS max_duration_ms
            FROM request_logs
            WHERE created_at >= :from AND created_at <= :to
            GROUP BY method, path
            ORDER BY avg_duration_ms DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findSlowestEndpoints(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("limit") int limit);

    long countByCreatedAtBefore(OffsetDateTime cutoff);

    @Modifying
    void deleteByCreatedAtBefore(OffsetDateTime cutoff);
}
