package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.monitor.RequestLogResponse;
import com.quickbooks.dto.monitor.RequestLogSummaryResponse;
import com.quickbooks.dto.monitor.SystemHealthResponse;
import com.quickbooks.entity.RequestLog;
import com.quickbooks.repository.RequestLogRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class MonitorService {

    public static final long SLOW_THRESHOLD_MS = 2000L;
    public static final int RETENTION_DAYS = 7;

    private final RequestLogRepository requestLogRepository;
    private final RequestLogWriter requestLogWriter;
    private final DataSource dataSource;
    private final TaskExecutor monitoringTaskExecutor;

    public MonitorService(RequestLogRepository requestLogRepository,
                          RequestLogWriter requestLogWriter,
                          DataSource dataSource,
                          @Qualifier("monitoringTaskExecutor") TaskExecutor monitoringTaskExecutor) {
        this.requestLogRepository = requestLogRepository;
        this.requestLogWriter = requestLogWriter;
        this.dataSource = dataSource;
        this.monitoringTaskExecutor = monitoringTaskExecutor;
    }

    public void recordRequestAsync(RequestLogDraft draft) {
        monitoringTaskExecutor.execute(() -> requestLogWriter.save(draft));
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestLogResponse> findRequestLogs(
            Long subscriberId,
            Long companyId,
            String userRole,
            boolean errorsOnly,
            boolean slowOnly,
            String path,
            OffsetDateTime from,
            OffsetDateTime to,
            int page,
            int size) {
        OffsetDateTime effectiveFrom = from != null ? from : OffsetDateTime.now().minusDays(1);
        OffsetDateTime effectiveTo = to != null ? to : OffsetDateTime.now();
        String pathFilter = path != null && !path.isBlank() ? path.trim() : null;
        String roleFilter = userRole != null && !userRole.isBlank() ? userRole.trim().toUpperCase() : null;
        String pathPattern = pathFilter != null ? "%" + pathFilter.toLowerCase() + "%" : null;

        Page<RequestLog> result = requestLogRepository.search(
                subscriberId,
                companyId,
                roleFilter,
                errorsOnly,
                slowOnly,
                SLOW_THRESHOLD_MS,
                pathPattern,
                effectiveFrom,
                effectiveTo,
                PageRequest.of(page, size));

        return PageResponse.from(result.map(RequestLogResponse::from));
    }

    @Transactional(readOnly = true)
    public RequestLogSummaryResponse getSummary(int windowMinutes) {
        int minutes = Math.min(Math.max(windowMinutes, 5), 24 * 60);
        OffsetDateTime to = OffsetDateTime.now();
        OffsetDateTime from = to.minusMinutes(minutes);

        RequestLogSummaryResponse summary = new RequestLogSummaryResponse();
        summary.setWindowStart(from);
        summary.setWindowEnd(to);
        summary.setWindowMinutes(minutes);
        summary.setTotalRequests(requestLogRepository.countInWindow(from, to));
        summary.setErrorCount(requestLogRepository.countErrorsInWindow(from, to));
        summary.setSlowCount(requestLogRepository.countSlowInWindow(from, to, SLOW_THRESHOLD_MS));
        summary.setAvgDurationMs(Math.round(requestLogRepository.avgDurationInWindow(from, to) * 10.0) / 10.0);
        summary.setMaxDurationMs(requestLogRepository.maxDurationInWindow(from, to));
        summary.setSlowestEndpoints(mapSlowestEndpoints(
                requestLogRepository.findSlowestEndpoints(from, to, 10)));

        return summary;
    }

    @Transactional(readOnly = true)
    public SystemHealthResponse getSystemHealth() {
        SystemHealthResponse response = new SystemHealthResponse();
        response.setService("quick-books-api");
        response.setDatabase(checkDatabase());
        response.setJvm(readJvmHealth());
        response.setMonitoring(readMonitoringHealth());
        response.setRecentTraffic(getSummary(15));

        boolean up = "UP".equals(response.getDatabase().getStatus());
        response.setStatus(up ? "UP" : "DOWN");
        return response;
    }

    private SystemHealthResponse.DatabaseHealth checkDatabase() {
        SystemHealthResponse.DatabaseHealth database = new SystemHealthResponse.DatabaseHealth();
        long start = System.nanoTime();
        try (Connection connection = dataSource.getConnection()) {
            connection.isValid(2);
            database.setStatus("UP");
        } catch (Exception ex) {
            database.setStatus("DOWN");
        }
        database.setResponseTimeMs((System.nanoTime() - start) / 1_000_000);
        return database;
    }

    private SystemHealthResponse.JvmHealth readJvmHealth() {
        SystemHealthResponse.JvmHealth jvm = new SystemHealthResponse.JvmHealth();
        Runtime runtime = Runtime.getRuntime();
        long used = runtime.totalMemory() - runtime.freeMemory();
        jvm.setHeapUsedMb(used / (1024 * 1024));
        jvm.setHeapMaxMb(runtime.maxMemory() / (1024 * 1024));
        jvm.setUptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        return jvm;
    }

    private SystemHealthResponse.MonitoringHealth readMonitoringHealth() {
        SystemHealthResponse.MonitoringHealth monitoring = new SystemHealthResponse.MonitoringHealth();
        monitoring.setStoredLogs(requestLogRepository.count());
        monitoring.setRetentionDays(RETENTION_DAYS);
        return monitoring;
    }

    private List<RequestLogSummaryResponse.SlowEndpointStat> mapSlowestEndpoints(List<Object[]> rows) {
        return rows.stream().map(row -> {
            RequestLogSummaryResponse.SlowEndpointStat stat = new RequestLogSummaryResponse.SlowEndpointStat();
            stat.setMethod(String.valueOf(row[0]));
            stat.setPath(String.valueOf(row[1]));
            stat.setRequestCount(((Number) row[2]).longValue());
            stat.setAvgDurationMs(Math.round(((Number) row[3]).doubleValue() * 10.0) / 10.0);
            stat.setMaxDurationMs(((Number) row[4]).longValue());
            return stat;
        }).toList();
    }

    public record RequestLogDraft(
            String method,
            String path,
            String queryString,
            int statusCode,
            long durationMs,
            String clientIp,
            String userRole,
            Long subscriberId,
            Long companyId,
            String actorName,
            String actorType
    ) {}
}
