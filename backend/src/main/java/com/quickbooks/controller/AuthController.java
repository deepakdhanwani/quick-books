package com.quickbooks.controller;

import com.quickbooks.dto.auth.AdminLoginRequest;
import com.quickbooks.dto.auth.AuthResponse;
import com.quickbooks.dto.auth.SubscriberLoginRequest;
import com.quickbooks.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/admin/login")
    public AuthResponse adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        return authService.adminLogin(request);
    }

    @PostMapping("/subscriber/login")
    public AuthResponse subscriberLogin(@Valid @RequestBody SubscriberLoginRequest request) {
        return authService.subscriberLogin(request);
    }
}
