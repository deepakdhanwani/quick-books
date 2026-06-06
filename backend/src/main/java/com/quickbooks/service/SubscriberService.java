package com.quickbooks.service;

import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.util.PinGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final PasswordEncoder passwordEncoder;
    private final PinGenerator pinGenerator;

    public SubscriberService(SubscriberRepository subscriberRepository,
                             PasswordEncoder passwordEncoder,
                             PinGenerator pinGenerator) {
        this.subscriberRepository = subscriberRepository;
        this.passwordEncoder = passwordEncoder;
        this.pinGenerator = pinGenerator;
    }

    public List<SubscriberResponse> findAll() {
        return subscriberRepository.findAll().stream()
                .map(SubscriberResponse::from)
                .toList();
    }

    public SubscriberResponse create(CreateSubscriberRequest request) {
        if (subscriberRepository.existsByPhone(request.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        String loginPin = pinGenerator.generatePin();

        Subscriber subscriber = new Subscriber();
        subscriber.setBusinessName(request.getBusinessName());
        subscriber.setOwnerName(request.getOwnerName());
        subscriber.setPhone(request.getPhone());
        subscriber.setBusinessType(request.getBusinessType());
        subscriber.setLoginPinHash(passwordEncoder.encode(loginPin));
        subscriber.setSubscriptionStatus(SubscriptionStatus.NONE);

        Subscriber saved = subscriberRepository.save(subscriber);
        SubscriberResponse response = SubscriberResponse.from(saved);
        response.setLoginPin(loginPin);
        return response;
    }
}
