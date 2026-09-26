package com.quickflow.common.error;

/** A violated business rule on a specific field. Mapped to 400 with an {@code errors} map. */
public class BusinessRuleException extends RuntimeException {

    private final String field;

    public BusinessRuleException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
