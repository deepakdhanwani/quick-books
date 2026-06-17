package com.quickbooks.security;

import com.quickbooks.entity.Company;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.service.StaffAccessService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final CompanyRepository companyRepository;
    private final StaffAccessService staffAccessService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CompanyRepository companyRepository,
                                   StaffAccessService staffAccessService) {
        this.jwtService = jwtService;
        this.companyRepository = companyRepository;
        this.staffAccessService = staffAccessService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    UserPrincipal principal = jwtService.parseToken(token);
                    if (principal.getRole() == UserRole.SUBSCRIBER) {
                        enrichSubscriberPrincipal(principal);
                        applyCompanyContext(request, principal);
                    }
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + principal.getRole().name()))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (Exception ex) {
                    log.debug("JWT authentication failed for {}: {}", request.getRequestURI(), ex.getMessage());
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void enrichSubscriberPrincipal(UserPrincipal principal) {
        if (!principal.isStaff()) {
            return;
        }
        try {
            StaffPermissions permissions = staffAccessService.loadForStaff(
                    principal.getSubscriberId(),
                    principal.getActorId());
            principal.setStaffPermissions(permissions);
        } catch (Exception ex) {
            log.warn("Failed to load staff permissions for user {}: {}", principal.getActorId(), ex.getMessage());
        }
    }

    private void applyCompanyContext(HttpServletRequest request, UserPrincipal principal) {
        Long requestedCompanyId = parseCompanyHeader(request.getHeader("X-Company-Id"));
        Long resolvedCompanyId = resolveCompanyId(principal, requestedCompanyId);
        if (resolvedCompanyId != null) {
            principal.setCompanyId(resolvedCompanyId);
        }
    }

    private Long resolveCompanyId(UserPrincipal principal, Long requestedCompanyId) {
        if (principal.isStaff()) {
            StaffPermissions permissions = principal.getStaffPermissions();
            if (permissions == null || permissions.getCompanyIds().isEmpty()) {
                return null;
            }
            if (requestedCompanyId != null && permissions.canAccessCompany(requestedCompanyId)
                    && isSubscriberCompany(principal.getSubscriberId(), requestedCompanyId)) {
                return requestedCompanyId;
            }
            return permissions.getCompanyIds().iterator().next();
        }

        if (requestedCompanyId != null && isSubscriberCompany(principal.getSubscriberId(), requestedCompanyId)) {
            return requestedCompanyId;
        }

        return companyRepository.findFirstBySubscriberIdAndActiveTrueOrderByCreatedAtAsc(principal.getSubscriberId())
                .map(Company::getId)
                .orElse(null);
    }

    private boolean isSubscriberCompany(Long subscriberId, Long companyId) {
        return companyRepository.findByIdAndSubscriberIdAndActiveTrue(companyId, subscriberId).isPresent();
    }

    private Long parseCompanyHeader(String companyHeader) {
        if (companyHeader == null || companyHeader.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(companyHeader.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
