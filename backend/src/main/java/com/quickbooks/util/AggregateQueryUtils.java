package com.quickbooks.util;

import java.math.BigDecimal;
import java.util.List;

public final class AggregateQueryUtils {

    private AggregateQueryUtils() {
    }

    public static Object[] firstRow(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return new Object[0];
        }
        return flattenRow(rows.get(0));
    }

    public static Object[] flattenRow(Object[] row) {
        if (row == null || row.length == 0) {
            return new Object[0];
        }
        if (row.length == 1 && row[0] instanceof Object[] nested) {
            return nested;
        }
        return row;
    }

    public static BigDecimal amountAt(Object[] row, int index) {
        Object[] values = flattenRow(row);
        if (values.length <= index || values[index] == null) {
            return BigDecimal.ZERO;
        }
        Object value = values[index];
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }
}
