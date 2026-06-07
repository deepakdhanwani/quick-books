package com.quickbooks.service;

import com.quickbooks.entity.AuditLog;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.repository.AuditLogRepository;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.security.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(AuditAction action, AuditEntityType entityType, Long entityId, String details) {
        UserPrincipal principal = getCurrentSubscriberPrincipal();
        if (principal == null) {
            return;
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setSubscriberId(principal.getSubscriberId());
        auditLog.setActorType(principal.getActorType());
        auditLog.setActorId(principal.getActorId());
        auditLog.setActorName(principal.getActorName());
        auditLog.setActorPin(principal.getActorPin());
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(trimDetails(details));
        auditLogRepository.save(auditLog);
    }

    private UserPrincipal getCurrentSubscriberPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        if (principal.getRole() != UserRole.SUBSCRIBER || principal.getActorType() == null) {
            return null;
        }
        return principal;
    }

    private String trimDetails(String details) {
        if (details == null || details.isBlank()) {
            return null;
        }
        String trimmed = details.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    public static void requireOwner(UserPrincipal principal) {
        if (principal.getActorType() != ActorType.OWNER) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Only the account owner can perform this action");
        }
    }
}
