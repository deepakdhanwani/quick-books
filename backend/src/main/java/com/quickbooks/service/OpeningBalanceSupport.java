package com.quickbooks.service;

import com.quickbooks.entity.enums.OpeningBalanceNature;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class OpeningBalanceSupport {

    private OpeningBalanceSupport() {
    }

    public record OpeningSplit(BigDecimal debit, BigDecimal credit) {
    }

    public static BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opening balance cannot be negative");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static OpeningSplit customerOpening(BigDecimal amount, OpeningBalanceNature nature) {
        BigDecimal normalized = normalizeAmount(amount);
        if (normalized.compareTo(BigDecimal.ZERO) == 0) {
            return new OpeningSplit(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        if (nature == null || nature == OpeningBalanceNature.TO_RECEIVE) {
            return new OpeningSplit(normalized, BigDecimal.ZERO);
        }
        return new OpeningSplit(BigDecimal.ZERO, normalized);
    }

    public static OpeningSplit vendorOpening(BigDecimal amount, OpeningBalanceNature nature) {
        BigDecimal normalized = normalizeAmount(amount);
        if (normalized.compareTo(BigDecimal.ZERO) == 0) {
            return new OpeningSplit(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        if (nature == null || nature == OpeningBalanceNature.TO_PAY) {
            return new OpeningSplit(BigDecimal.ZERO, normalized);
        }
        return new OpeningSplit(normalized, BigDecimal.ZERO);
    }

    public static BigDecimal customerNetBalance(OpeningSplit opening) {
        return opening.debit().subtract(opening.credit());
    }

    public static BigDecimal vendorNetBalance(OpeningSplit opening) {
        return opening.credit().subtract(opening.debit());
    }
}
