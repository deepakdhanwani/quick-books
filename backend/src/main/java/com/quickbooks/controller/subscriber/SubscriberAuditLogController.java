package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.audit.AuditLogResponse;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.repository.AuditLogRepository;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.AuditLogService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscriber/audit-logs")
public class SubscriberAuditLogController {

    private final AuditLogRepository auditLogRepository;

    public SubscriberAuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public PageResponse<AuditLogResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        AuditLogService.requireOwner(principal);
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("createdAt").descending());
        return PageResponse.from(
                auditLogRepository.findBySubscriberIdOrderByCreatedAtDesc(principal.getSubscriberId(), pageable)
                        .map(AuditLogResponse::from)
        );
    }
}
