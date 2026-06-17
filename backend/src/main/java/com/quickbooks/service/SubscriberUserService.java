package com.quickbooks.service;

import com.quickbooks.dto.subscriberuser.CreateSubscriberUserRequest;
import com.quickbooks.dto.subscriberuser.SubscriberUserResponse;
import com.quickbooks.dto.subscriberuser.UpdateSubscriberUserRequest;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.entity.SubscriberUserCompany;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.repository.SubscriberUserCompanyRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.util.PinGenerator;
import com.quickbooks.util.PinValidator;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SubscriberUserService {

    private final SubscriberUserRepository subscriberUserRepository;
    private final SubscriberUserCompanyRepository subscriberUserCompanyRepository;
    private final SubscriberService subscriberService;
    private final StaffAccessService staffAccessService;
    private final PasswordEncoder passwordEncoder;
    private final PinGenerator pinGenerator;
    private final AuditLogService auditLogService;

    public SubscriberUserService(SubscriberUserRepository subscriberUserRepository,
                                 SubscriberUserCompanyRepository subscriberUserCompanyRepository,
                                 SubscriberService subscriberService,
                                 StaffAccessService staffAccessService,
                                 PasswordEncoder passwordEncoder,
                                 PinGenerator pinGenerator,
                                 AuditLogService auditLogService) {
        this.subscriberUserRepository = subscriberUserRepository;
        this.subscriberUserCompanyRepository = subscriberUserCompanyRepository;
        this.subscriberService = subscriberService;
        this.staffAccessService = staffAccessService;
        this.passwordEncoder = passwordEncoder;
        this.pinGenerator = pinGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<SubscriberUserResponse> list(Long subscriberId) {
        return subscriberUserRepository.findBySubscriberIdOrderByNameAsc(subscriberId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriberUserResponse getById(Long subscriberId, Long userId) {
        return toResponse(getOwnedUser(subscriberId, userId));
    }

    @Transactional
    public SubscriberUserResponse create(Long subscriberId, CreateSubscriberUserRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        String name = normalizeName(request.getName());
        PinValidator.validateNewPin(request.getLoginPin());
        ensureUniquePin(subscriberId, request.getLoginPin(), null);

        SubscriberUser user = new SubscriberUser();
        user.setSubscriber(subscriber);
        user.setName(name);
        applyLoginPin(user, request.getLoginPin());
        user.setActive(true);

        SubscriberUser saved = subscriberUserRepository.save(user);
        staffAccessService.applyPermissions(subscriberId, saved, request.getPermissions());
        auditLogService.log(AuditAction.CREATE, AuditEntityType.SUBSCRIBER_USER, saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public SubscriberUserResponse update(Long subscriberId, Long userId, UpdateSubscriberUserRequest request) {
        SubscriberUser user = getOwnedUser(subscriberId, userId);
        user.setName(normalizeName(request.getName()));
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getPermissions() != null) {
            staffAccessService.applyPermissions(subscriberId, user, request.getPermissions());
        }

        SubscriberUser saved = subscriberUserRepository.save(user);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.SUBSCRIBER_USER, saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public SubscriberUserResponse setLoginPin(Long subscriberId, Long userId, String loginPin) {
        SubscriberUser user = getOwnedUser(subscriberId, userId);
        PinValidator.validateNewPin(loginPin);
        ensureUniquePin(subscriberId, loginPin, userId);
        applyLoginPin(user, loginPin);

        SubscriberUser saved = subscriberUserRepository.save(user);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.SUBSCRIBER_USER, saved.getId(), "PIN updated for " + saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public SubscriberUserResponse resetLoginPin(Long subscriberId, Long userId) {
        SubscriberUser user = getOwnedUser(subscriberId, userId);
        String loginPin = pinGenerator.generatePin();
        ensureUniquePin(subscriberId, loginPin, userId);
        applyLoginPin(user, loginPin);

        SubscriberUser saved = subscriberUserRepository.save(user);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.SUBSCRIBER_USER, saved.getId(), "PIN reset for " + saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long subscriberId, Long userId) {
        SubscriberUser user = getOwnedUser(subscriberId, userId);
        auditLogService.log(AuditAction.DELETE, AuditEntityType.SUBSCRIBER_USER, user.getId(), user.getName());
        subscriberUserCompanyRepository.deleteBySubscriberUserId(userId);
        subscriberUserRepository.delete(user);
    }

    private SubscriberUserResponse toResponse(SubscriberUser user) {
        List<Long> companyIds = subscriberUserCompanyRepository.findBySubscriberUserIdOrderByCompanyIdAsc(user.getId()).stream()
                .map(SubscriberUserCompany::getCompanyId)
                .toList();
        return SubscriberUserResponse.from(user, companyIds);
    }

    private SubscriberUser getOwnedUser(Long subscriberId, Long userId) {
        return subscriberUserRepository.findByIdAndSubscriberId(userId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void ensureUniquePin(Long subscriberId, String loginPin, Long excludeUserId) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        if (passwordEncoder.matches(loginPin, subscriber.getLoginPinHash())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PIN is already used by the account owner");
        }

        for (SubscriberUser user : subscriberUserRepository.findBySubscriberIdOrderByNameAsc(subscriberId)) {
            if (excludeUserId != null && excludeUserId.equals(user.getId())) {
                continue;
            }
            if (passwordEncoder.matches(loginPin, user.getLoginPinHash())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "PIN is already assigned to another user");
            }
        }
    }

    private void applyLoginPin(SubscriberUser user, String loginPin) {
        user.setLoginPin(loginPin);
        user.setLoginPinHash(passwordEncoder.encode(loginPin));
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        return name.trim();
    }
}
