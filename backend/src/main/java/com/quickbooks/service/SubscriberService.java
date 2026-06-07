package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.subscriber.ChangeSubscriberPinRequest;
import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscriberAccountProfileResponse;
import com.quickbooks.dto.subscriber.SubscriberDetailResponse;
import com.quickbooks.dto.subscriber.SubscriberOptionResponse;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.dto.subscriber.SubscriberSubscriptionInfo;
import com.quickbooks.dto.subscriber.UpdateSubscriberAccountSettingsRequest;
import com.quickbooks.dto.subscriber.UpdateSubscriberRequest;
import com.quickbooks.util.PinValidator;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.entity.enums.SubscriptionRecordStatus;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberSubscriptionRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.util.PinGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final SubscriberUserRepository subscriberUserRepository;
    private final SubscriberSubscriptionRepository subscriberSubscriptionRepository;
    private final SubscriberSubscriptionService subscriberSubscriptionService;
    private final BusinessTypeService businessTypeService;
    private final PasswordEncoder passwordEncoder;
    private final PinGenerator pinGenerator;

    public SubscriberService(SubscriberRepository subscriberRepository,
                             SubscriberUserRepository subscriberUserRepository,
                             SubscriberSubscriptionRepository subscriberSubscriptionRepository,
                             SubscriberSubscriptionService subscriberSubscriptionService,
                             BusinessTypeService businessTypeService,
                             PasswordEncoder passwordEncoder,
                             PinGenerator pinGenerator) {
        this.subscriberRepository = subscriberRepository;
        this.subscriberUserRepository = subscriberUserRepository;
        this.subscriberSubscriptionRepository = subscriberSubscriptionRepository;
        this.subscriberSubscriptionService = subscriberSubscriptionService;
        this.businessTypeService = businessTypeService;
        this.passwordEncoder = passwordEncoder;
        this.pinGenerator = pinGenerator;
    }

    @Transactional(readOnly = true)
    public PageResponse<SubscriberResponse> findPage(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("createdAt").descending());
        Page<SubscriberResponse> result = subscriberRepository.findAll(pageable)
                .map(SubscriberResponse::from);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public List<SubscriberOptionResponse> findSelectable() {
        return subscriberRepository.findByActiveTrueOrderByBusinessNameAsc().stream()
                .map(SubscriberOptionResponse::from)
                .toList();
    }

    public Subscriber getById(Long id) {
        return subscriberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found"));
    }

    @Transactional
    public SubscriberAccountProfileResponse getAccountProfile(Long id) {
        return getAccountProfile(id, null);
    }

    @Transactional
    public SubscriberAccountProfileResponse getAccountProfile(Long id, UserPrincipal principal) {
        subscriberSubscriptionService.syncSubscriptionStatus(id);
        Subscriber subscriber = getById(id);
        SubscriberAccountProfileResponse response = SubscriberAccountProfileResponse.from(subscriber);

        if (principal != null && principal.getActorType() != null) {
            response.setLoggedInUserName(principal.getActorName());
            response.setUserType(principal.getActorType().name());
            response.setCanChangePin(principal.getActorType() == ActorType.OWNER);
            response.setOwner(principal.getActorType() == ActorType.OWNER);

            if (principal.getActorType() == ActorType.STAFF) {
                SubscriberUser staffUser = subscriberUserRepository
                        .findByIdAndSubscriberId(principal.getActorId(), principal.getSubscriberId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team user not found"));
                response.setTheme(staffUser.getThemeMode());
                response.setFontSize(staffUser.getFontSize());
            } else {
                response.setTheme(subscriber.getThemeMode());
                response.setFontSize(subscriber.getFontSize());
            }
        } else {
            response.setTheme(subscriber.getThemeMode());
            response.setFontSize(subscriber.getFontSize());
        }

        if (subscriber.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            subscriberSubscriptionRepository
                    .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(id, SubscriptionRecordStatus.ACTIVE)
                    .ifPresent(sub -> response.setCurrentSubscription(SubscriberSubscriptionInfo.from(sub)));
        } else if (subscriber.getSubscriptionStatus() == SubscriptionStatus.EXPIRED) {
            subscriberSubscriptionRepository.findFirstBySubscriber_IdOrderByEndDateDesc(id)
                    .ifPresent(sub -> response.setCurrentSubscription(SubscriberSubscriptionInfo.from(sub)));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public SubscriberDetailResponse getDetail(Long id) {
        Subscriber subscriber = getById(id);
        SubscriberDetailResponse response = SubscriberDetailResponse.from(subscriber);

        subscriberSubscriptionRepository.findBySubscriber_IdOrderByCreatedAtDesc(id).stream()
                .map(SubscriberSubscriptionInfo::from)
                .forEach(info -> response.getSubscriptionHistory().add(info));

        if (subscriber.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            subscriberSubscriptionRepository
                    .findFirstBySubscriberIdAndStatusOrderByEndDateDesc(id, SubscriptionRecordStatus.ACTIVE)
                    .ifPresent(sub -> response.setCurrentSubscription(SubscriberSubscriptionInfo.from(sub)));
        } else if (subscriber.getSubscriptionStatus() == SubscriptionStatus.EXPIRED
                && !response.getSubscriptionHistory().isEmpty()) {
            response.setCurrentSubscription(response.getSubscriptionHistory().getFirst());
        }

        return response;
    }

    @Transactional
    public SubscriberResponse create(CreateSubscriberRequest request) {
        if (subscriberRepository.existsByPhone(request.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        BusinessType businessType = businessTypeService.getById(request.getBusinessTypeId());
        if (!businessType.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected business type is not active");
        }

        String loginPin = pinGenerator.generatePin();

        Subscriber subscriber = new Subscriber();
        subscriber.setBusinessName(request.getBusinessName());
        subscriber.setOwnerName(request.getOwnerName());
        subscriber.setPhone(request.getPhone());
        subscriber.setBusinessType(businessType);
        applyLoginPin(subscriber, loginPin);
        subscriber.setSubscriptionStatus(SubscriptionStatus.NONE);
        subscriber.setActive(true);

        Subscriber saved = subscriberRepository.save(subscriber);
        SubscriberResponse response = SubscriberResponse.from(saved);
        response.setLoginPin(loginPin);
        return response;
    }

    @Transactional
    public SubscriberResponse update(Long id, UpdateSubscriberRequest request) {
        Subscriber subscriber = getById(id);

        if (subscriberRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        BusinessType businessType = businessTypeService.getById(request.getBusinessTypeId());
        if (!businessType.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected business type is not active");
        }

        subscriber.setBusinessName(request.getBusinessName().trim());
        subscriber.setOwnerName(request.getOwnerName().trim());
        subscriber.setPhone(request.getPhone().trim());
        subscriber.setBusinessType(businessType);
        subscriber.setActive(request.getActive());

        return SubscriberResponse.from(subscriberRepository.save(subscriber));
    }

    @Transactional
    public SubscriberResponse resetLoginPin(Long id) {
        Subscriber subscriber = getById(id);
        String loginPin = pinGenerator.generatePin();
        applyLoginPin(subscriber, loginPin);

        Subscriber saved = subscriberRepository.save(subscriber);
        SubscriberResponse response = SubscriberResponse.from(saved);
        response.setLoginPin(loginPin);
        return response;
    }

    @Transactional
    public SubscriberAccountProfileResponse updateAccountSettings(Long subscriberId,
                                                                  UpdateSubscriberAccountSettingsRequest request) {
        Subscriber subscriber = getById(subscriberId);

        if (request.getDefaultTaxPercent() != null) {
            BigDecimal taxPercent = request.getDefaultTaxPercent().setScale(2, java.math.RoundingMode.HALF_UP);
            if (taxPercent.compareTo(BigDecimal.ZERO) < 0 || taxPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default tax percent must be between 0 and 100");
            }
            subscriber.setDefaultTaxPercent(taxPercent);
        } else {
            subscriber.setDefaultTaxPercent(null);
        }

        subscriber.setGstNumber(normalizeOptional(request.getGstNumber()));
        subscriberRepository.save(subscriber);
        return getAccountProfile(subscriberId);
    }

    @Transactional
    public void changeLoginPin(Long subscriberId, ChangeSubscriberPinRequest request, UserPrincipal principal) {
        AuditLogService.requireOwner(principal);
        Subscriber subscriber = getById(subscriberId);
        PinValidator.validateChangeRequest(request.getCurrentPin(), request.getNewPin(), request.getConfirmNewPin());

        if (!passwordEncoder.matches(request.getCurrentPin(), subscriber.getLoginPinHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current PIN is incorrect");
        }

        applyLoginPin(subscriber, request.getNewPin());
        subscriberRepository.save(subscriber);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void applyLoginPin(Subscriber subscriber, String loginPin) {
        if (loginPin == null || loginPin.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Login PIN must not be empty");
        }
        subscriber.setLoginPin(loginPin);
        subscriber.setLoginPinHash(passwordEncoder.encode(loginPin));
    }
}
