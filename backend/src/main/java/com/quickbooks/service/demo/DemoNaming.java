package com.quickbooks.service.demo;

import java.util.Locale;
import java.util.Map;

public final class DemoNaming {

    private static final Map<String, String> KNOWN_ALIASES = Map.of(
            "main", "M",
            "north", "N",
            "south", "S",
            "east", "E",
            "west", "W"
    );

    private DemoNaming() {
    }

    /**
     * Compact company tag for suffixes, e.g. "Demo - Retail - North" -> "N".
     */
    public static String companyAlias(String companyName) {
        if (companyName == null || companyName.isBlank()) {
            return "M";
        }
        String trimmed = companyName.trim();
        int separator = trimmed.lastIndexOf(" - ");
        if (separator < 0) {
            return compactTag(trimmed);
        }

        String lastSegment = trimmed.substring(separator + 3).trim();
        String known = KNOWN_ALIASES.get(lastSegment.toLowerCase(Locale.ROOT));
        if (known != null) {
            return known;
        }

        // Legacy default company created as "Demo - Retail" (no branch suffix).
        int firstSeparator = trimmed.indexOf(" - ");
        if (firstSeparator == separator && trimmed.regionMatches(true, 0, "Demo - ", 0, 7)) {
            return "M";
        }

        return compactTag(lastSegment);
    }

    public static String suffixed(String base, String alias) {
        return base + " ·" + alias;
    }

    public static String customerName(String alias, int sequence, String businessTypeName) {
        return suffixed("Customer " + sequence + " - " + businessTypeName, alias);
    }

    public static String vendorName(String alias, int sequence, String businessTypeName) {
        return suffixed("Vendor " + sequence + " - " + businessTypeName, alias);
    }

    public static String productName(String alias, String baseName) {
        return suffixed(baseName, alias);
    }

    private static String compactTag(String raw) {
        String compact = raw.replaceAll("[^A-Za-z0-9]", "");
        if (compact.isEmpty()) {
            return "X";
        }
        if (compact.length() == 1) {
            return compact.toUpperCase(Locale.ROOT);
        }
        return compact.substring(0, Math.min(2, compact.length())).toUpperCase(Locale.ROOT);
    }
}
