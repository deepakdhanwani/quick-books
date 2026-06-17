package com.quickbooks.controller.admin;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.monitor.RequestLogResponse;
import com.quickbooks.dto.monitor.RequestLogSummaryResponse;
import com.quickbooks.dto.monitor.SystemHealthResponse;
import com.quickbooks.service.MonitorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/admin/monitor")
public class AdminMonitorController {

    private final MonitorService monitorService;

    public AdminMonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/health")
    public SystemHealthResponse health() {
        return monitorService.getSystemHealth();
    }

    @GetMapping("/request-logs/summary")
    public RequestLogSummaryResponse summary(
            @RequestParam(defaultValue = "60") int windowMinutes) {
        return monitorService.getSummary(windowMinutes);
    }

    @GetMapping("/request-logs")
    public PageResponse<RequestLogResponse> requestLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) Long subscriberId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String userRole,
            @RequestParam(defaultValue = "false") boolean errorsOnly,
            @RequestParam(defaultValue = "false") boolean slowOnly,
            @RequestParam(required = false) String path,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        int safeSize = Math.min(Math.max(size, 10), 100);
        return monitorService.findRequestLogs(
                subscriberId,
                companyId,
                userRole,
                errorsOnly,
                slowOnly,
                path,
                from,
                to,
                page,
                safeSize);
    }
}
