package com.quickbooks.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class InvoiceNumberGenerator {

    private static final Pattern TRAILING_NUMBER = Pattern.compile("^(.*?)(\\d+)$");

    private InvoiceNumberGenerator() {
    }

    public static String defaultFirst() {
        return "INV-0001";
    }

    public static String suggestNext(String lastInvoiceNumber) {
        if (lastInvoiceNumber == null || lastInvoiceNumber.isBlank()) {
            return defaultFirst();
        }

        Matcher matcher = TRAILING_NUMBER.matcher(lastInvoiceNumber.trim());
        if (matcher.matches()) {
            String prefix = matcher.group(1);
            String numberPart = matcher.group(2);
            long nextValue = Long.parseLong(numberPart) + 1;
            String padded = String.format("%0" + numberPart.length() + "d", nextValue);
            return prefix + padded;
        }

        return lastInvoiceNumber.trim() + "-001";
    }
}
