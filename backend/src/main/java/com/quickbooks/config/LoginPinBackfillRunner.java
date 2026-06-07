package com.quickbooks.config;

import com.quickbooks.entity.Subscriber;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.util.PinGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class LoginPinBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LoginPinBackfillRunner.class);

    private final SubscriberRepository subscriberRepository;
    private final PasswordEncoder passwordEncoder;
    private final PinGenerator pinGenerator;

    public LoginPinBackfillRunner(SubscriberRepository subscriberRepository,
                                  PasswordEncoder passwordEncoder,
                                  PinGenerator pinGenerator) {
        this.subscriberRepository = subscriberRepository;
        this.passwordEncoder = passwordEncoder;
        this.pinGenerator = pinGenerator;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Subscriber> subscribers = subscriberRepository.findByLoginPinIsNull();
        if (subscribers.isEmpty()) {
            return;
        }

        for (Subscriber subscriber : subscribers) {
            String loginPin = pinGenerator.generatePin();
            subscriber.setLoginPin(loginPin);
            subscriber.setLoginPinHash(passwordEncoder.encode(loginPin));
            log.info(
                    "Stored admin-visible login PIN for legacy subscriber id={} phone={}",
                    subscriber.getId(),
                    subscriber.getPhone()
            );
        }

        subscriberRepository.saveAll(subscribers);
        log.warn(
                "Backfilled login PIN for {} legacy subscriber(s). Open each subscriber in admin to view and share the new PIN.",
                subscribers.size()
        );
    }
}
