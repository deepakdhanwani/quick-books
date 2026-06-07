package com.quickbooks.service;

import com.quickbooks.dto.subscriber.UpdateUserPreferencesRequest;
import com.quickbooks.dto.subscriber.UserPreferencesResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserPreferencesService {

    private final SubscriberService subscriberService;
    private final SubscriberRepository subscriberRepository;
    private final SubscriberUserRepository subscriberUserRepository;

    public UserPreferencesService(SubscriberService subscriberService,
                                  SubscriberRepository subscriberRepository,
                                  SubscriberUserRepository subscriberUserRepository) {
        this.subscriberService = subscriberService;
        this.subscriberRepository = subscriberRepository;
        this.subscriberUserRepository = subscriberUserRepository;
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(UserPrincipal principal) {
        if (principal.getActorType() == ActorType.STAFF) {
            SubscriberUser staffUser = getStaffUser(principal);
            return UserPreferencesResponse.of(staffUser.getThemeMode(), staffUser.getFontSize());
        }

        Subscriber subscriber = subscriberService.getById(principal.getSubscriberId());
        return UserPreferencesResponse.of(subscriber.getThemeMode(), subscriber.getFontSize());
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UserPrincipal principal, UpdateUserPreferencesRequest request) {
        if (principal.getActorType() == ActorType.STAFF) {
            SubscriberUser staffUser = getStaffUser(principal);
            staffUser.setThemeMode(request.getTheme());
            staffUser.setFontSize(request.getFontSize());
            subscriberUserRepository.save(staffUser);
            return UserPreferencesResponse.of(staffUser.getThemeMode(), staffUser.getFontSize());
        }

        Subscriber subscriber = subscriberService.getById(principal.getSubscriberId());
        subscriber.setThemeMode(request.getTheme());
        subscriber.setFontSize(request.getFontSize());
        subscriberRepository.save(subscriber);
        return UserPreferencesResponse.of(subscriber.getThemeMode(), subscriber.getFontSize());
    }

    private SubscriberUser getStaffUser(UserPrincipal principal) {
        return subscriberUserRepository.findByIdAndSubscriberId(principal.getActorId(), principal.getSubscriberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team user not found"));
    }
}
