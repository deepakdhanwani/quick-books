package com.quickbooks.service;

import com.quickbooks.dto.auth.AdminLoginRequest;
import com.quickbooks.dto.auth.AuthResponse;
import com.quickbooks.dto.auth.SubscriberLoginRequest;
import com.quickbooks.entity.Admin;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.AdminRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.security.JwtService;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.security.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final SubscriberRepository subscriberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AdminRepository adminRepository,
                       SubscriberRepository subscriberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.adminRepository = adminRepository;
        this.subscriberRepository = subscriberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse adminLogin(AdminLoginRequest request) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserPrincipal principal = new UserPrincipal(admin.getId(), admin.getEmail(), UserRole.ADMIN);
        AuthResponse response = new AuthResponse(jwtService.generateToken(principal), UserRole.ADMIN.name(), admin.getId());
        return response;
    }

    public AuthResponse subscriberLogin(SubscriberLoginRequest request) {
        Subscriber subscriber = subscriberRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!subscriber.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is inactive. Contact admin.");
        }

        if (!passwordEncoder.matches(request.getLoginPin(), subscriber.getLoginPinHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserPrincipal principal = new UserPrincipal(subscriber.getId(), subscriber.getPhone(), UserRole.SUBSCRIBER);
        AuthResponse response = new AuthResponse(
                jwtService.generateToken(principal),
                UserRole.SUBSCRIBER.name(),
                subscriber.getId()
        );
        response.setSubscriptionStatus(subscriber.getSubscriptionStatus());
        response.setRequiresSubscription(
                subscriber.getSubscriptionStatus() == SubscriptionStatus.NONE
                        || subscriber.getSubscriptionStatus() == SubscriptionStatus.EXPIRED
        );
        return response;
    }
}
