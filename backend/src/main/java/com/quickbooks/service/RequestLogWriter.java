package com.quickbooks.service;

import com.quickbooks.entity.RequestLog;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.RequestLogRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.security.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class RequestLogWriter {

    private final RequestLogRepository requestLogRepository;
    private final SubscriberRepository subscriberRepository;
    private final CompanyRepository companyRepository;

    public RequestLogWriter(RequestLogRepository requestLogRepository,
                            SubscriberRepository subscriberRepository,
                            CompanyRepository companyRepository) {
        this.requestLogRepository = requestLogRepository;
        this.subscriberRepository = subscriberRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public void save(MonitorService.RequestLogDraft draft) {
        RequestLog log = new RequestLog();
        log.setCreatedAt(OffsetDateTime.now());
        log.setMethod(draft.method());
        log.setPath(draft.path());
        log.setQueryString(trimTo(draft.queryString(), 1000));
        log.setStatusCode(draft.statusCode());
        log.setDurationMs(draft.durationMs());
        log.setClientIp(trimTo(draft.clientIp(), 45));
        log.setUserRole(draft.userRole());
        log.setSubscriberId(draft.subscriberId());
        log.setCompanyId(draft.companyId());
        log.setActorName(trimTo(draft.actorName(), 120));
        log.setActorType(draft.actorType());

        if (draft.userRole() != null && UserRole.ADMIN.name().equals(draft.userRole())) {
            log.setSubscriberName(trimTo(draft.actorName(), 200));
        } else if (draft.subscriberId() != null) {
            subscriberRepository.findById(draft.subscriberId()).ifPresent(subscriber ->
                    log.setSubscriberName(trimTo(subscriber.getBusinessName(), 200)));
        }

        if (draft.companyId() != null && draft.subscriberId() != null) {
            companyRepository.findByIdAndSubscriberIdAndActiveTrue(draft.companyId(), draft.subscriberId())
                    .ifPresent(company -> log.setCompanyName(trimTo(company.getName(), 200)));
        }

        requestLogRepository.save(log);
        maybeCleanupOldLogs();
    }

    private void maybeCleanupOldLogs() {
        if (requestLogRepository.count() % 250 != 0) {
            return;
        }
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(MonitorService.RETENTION_DAYS);
        requestLogRepository.deleteByCreatedAtBefore(cutoff);
    }

    private static String trimTo(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
