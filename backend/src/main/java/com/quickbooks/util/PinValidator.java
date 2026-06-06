package com.quickbooks.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

public final class PinValidator {

    private static final Pattern PIN_PATTERN = Pattern.compile("^[0-9]{6,8}$");

    private PinValidator() {
    }

    public static void validateNewPin(String newPin) {
        if (newPin == null || !PIN_PATTERN.matcher(newPin).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN must be 6 to 8 digits");
        }
    }

    public static void validateChangeRequest(String currentPin, String newPin, String confirmNewPin) {
        if (currentPin == null || currentPin.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current PIN is required");
        }
        validateNewPin(newPin);
        if (!newPin.equals(confirmNewPin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New PIN and confirmation do not match");
        }
        if (currentPin.equals(newPin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New PIN must be different from current PIN");
        }
    }
}
