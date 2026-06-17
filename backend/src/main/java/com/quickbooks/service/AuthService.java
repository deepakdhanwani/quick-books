package com.quickbooks.service;

import com.quickbooks.dto.auth.AdminLoginRequest;
import com.quickbooks.dto.auth.AuthResponse;
import com.quickbooks.dto.auth.SubscriberLoginRequest;
import com.quickbooks.dto.company.CompanyResponse;
import com.quickbooks.dto.subscriberuser.StaffPermissionsResponse;
import com.quickbooks.entity.Admin;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.AdminRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.security.JwtService;
import com.quickbooks.security.StaffPermissions;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.security.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final SubscriberRepository subscriberRepository;
    private final SubscriberUserRepository subscriberUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SubscriberSubscriptionService subscriberSubscriptionService;
    private final CompanyService companyService;
    private final StaffAccessService staffAccessService;

    public AuthService(AdminRepository adminRepository,
                       SubscriberRepository subscriberRepository,
                       SubscriberUserRepository subscriberUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       SubscriberSubscriptionService subscriberSubscriptionService,
                       CompanyService companyService,
                       StaffAccessService staffAccessService) {
        this.adminRepository = adminRepository;
        this.subscriberRepository = subscriberRepository;
        this.subscriberUserRepository = subscriberUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.subscriberSubscriptionService = subscriberSubscriptionService;
        this.companyService = companyService;
        this.staffAccessService = staffAccessService;
    }

    public AuthResponse adminLogin(AdminLoginRequest request) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserPrincipal principal = UserPrincipal.admin(admin.getId(), admin.getEmail());
        return new AuthResponse(jwtService.generateToken(principal), UserRole.ADMIN.name(), admin.getId());
    }

    public AuthResponse subscriberLogin(SubscriberLoginRequest request) {
        Subscriber subscriber = subscriberRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!subscriber.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is inactive. Contact admin.");
        }

        UserPrincipal principal = resolveSubscriberPrincipal(subscriber, request.getLoginPin());

        subscriberSubscriptionService.syncSubscriptionStatus(subscriber.getId());
        subscriber = subscriberRepository.findById(subscriber.getId()).orElseThrow();

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
        response.setUserName(principal.getActorName());
        response.setUserType(principal.getActorType().name());
        response.setCanChangePin(principal.getActorType() == ActorType.OWNER);
        if (principal.getActorType() == ActorType.STAFF) {
            response.setStaffUserId(principal.getActorId());
        }

        var defaultCompany = companyService.ensureDefaultCompany(subscriber.getId(), subscriber.getBusinessName());
        if (principal.getActorType() == ActorType.OWNER) {
            response.setStaffPermissions(StaffPermissionsResponse.ownerDefaults());
            response.setCompanies(companyService.list(subscriber.getId(), defaultCompany.getId()));
            response.setActiveCompanyId(defaultCompany.getId());
        } else {
            StaffPermissions permissions = staffAccessService.loadForStaff(subscriber.getId(), principal.getActorId());
            List<CompanyResponse> companies = companyService.list(subscriber.getId(), defaultCompany.getId()).stream()
                    .filter(company -> permissions.canAccessCompany(company.getId()))
                    .toList();
            response.setStaffPermissions(StaffPermissionsResponse.from(permissions));
            response.setCompanies(companies);
            response.setActiveCompanyId(companies.isEmpty() ? null : companies.get(0).getId());
        }
        return response;
    }

    private UserPrincipal resolveSubscriberPrincipal(Subscriber subscriber, String loginPin) {
        if (passwordEncoder.matches(loginPin, subscriber.getLoginPinHash())) {
            return UserPrincipal.owner(
                    subscriber.getId(),
                    subscriber.getPhone(),
                    subscriber.getOwnerName(),
                    subscriber.getLoginPin()
            );
        }

        SubscriberUser staffUser = subscriberUserRepository.findBySubscriberIdAndActiveTrue(subscriber.getId()).stream()
                .filter(user -> passwordEncoder.matches(loginPin, user.getLoginPinHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        return UserPrincipal.staff(
                subscriber.getId(),
                subscriber.getPhone(),
                staffUser.getId(),
                staffUser.getName(),
                staffUser.getLoginPin()
        );
    }
}
