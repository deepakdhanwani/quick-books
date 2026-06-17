package com.quickbooks.security;

import com.quickbooks.service.MonitorService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Set<String> SKIP_PREFIXES = Set.of(
            "/api/health",
            "/api/admin/monitor/request-logs",
            "/api/admin/monitor/health"
    );

    private final MonitorService monitorService;

    public RequestLoggingFilter(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (shouldSkip(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        long startedAt = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            monitorService.recordRequestAsync(buildDraft(request, response, durationMs));
        }
    }

    private boolean shouldSkip(String path) {
        for (String prefix : SKIP_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private MonitorService.RequestLogDraft buildDraft(HttpServletRequest request,
                                                      HttpServletResponse response,
                                                      long durationMs) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userRole = "ANONYMOUS";
        Long subscriberId = null;
        Long companyId = null;
        String actorName = null;
        String actorType = null;

        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            userRole = principal.getRole().name();
            subscriberId = principal.getSubscriberId();
            companyId = principal.getCompanyId();
            actorName = principal.getActorName();
            actorType = principal.getActorType() != null ? principal.getActorType().name() : null;
        }

        return new MonitorService.RequestLogDraft(
                request.getMethod(),
                trimPath(request.getRequestURI()),
                request.getQueryString(),
                response.getStatus(),
                durationMs,
                resolveClientIp(request),
                userRole,
                subscriberId,
                companyId,
                actorName,
                actorType
        );
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String trimPath(String path) {
        return path.length() <= 500 ? path : path.substring(0, 500);
    }
}
