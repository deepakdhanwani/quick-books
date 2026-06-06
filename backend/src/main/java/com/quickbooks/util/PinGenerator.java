package com.quickbooks.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class PinGenerator {

    private final SecureRandom secureRandom = new SecureRandom();

    public String generatePin() {
        int pin = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(pin);
    }
}
