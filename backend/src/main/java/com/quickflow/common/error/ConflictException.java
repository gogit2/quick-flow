package com.quickflow.common.error;

/** Duplicate or conflicting state. Mapped to 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
