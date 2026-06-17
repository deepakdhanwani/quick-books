package com.quickbooks.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.SubscriberRepository;
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

    private final JwtService jwtService;
    private final CompanyRepository companyRepository;
    private final SubscriberRepository subscriberRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CompanyRepository companyRepository,
                                   SubscriberRepository subscriberRepository) {
        this.jwtService = jwtService;
        this.companyRepository = companyRepository;
        this.subscriberRepository = subscriberRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                UserPrincipal principal = jwtService.parseToken(token);
                if (principal.getRole() == UserRole.SUBSCRIBER) {
                    applyCompanyContext(request, principal);
                }
                var authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + principal.getRole().name()))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private void applyCompanyContext(HttpServletRequest request, UserPrincipal principal) {
        String companyHeader = request.getHeader("X-Company-Id");
        Long requestedCompanyId = null;
        if (companyHeader != null && !companyHeader.isBlank()) {
            try {
                requestedCompanyId = Long.parseLong(companyHeader.trim());
            } catch (NumberFormatException ignored) {
                requestedCompanyId = null;
            }
        }

        if (requestedCompanyId != null) {
            Company company = companyRepository
                    .findByIdAndSubscriberIdAndActiveTrue(requestedCompanyId, principal.getSubscriberId())
                    .orElse(null);
            if (company != null) {
                principal.setCompanyId(company.getId());
                return;
            }
        }

        Subscriber subscriber = subscriberRepository.findById(principal.getSubscriberId()).orElse(null);
        if (subscriber == null) {
            return;
        }
        if (subscriber.getDefaultCompany() != null && subscriber.getDefaultCompany().isActive()) {
            principal.setCompanyId(subscriber.getDefaultCompany().getId());
            return;
        }

        companyRepository.findFirstBySubscriberIdAndActiveTrueOrderByCreatedAtAsc(principal.getSubscriberId())
                .ifPresent(company -> principal.setCompanyId(company.getId()));
    }
}
