package com.quickbooks.dto.settings;

public class RestoreDatabaseResponse {

    private String message;

    public RestoreDatabaseResponse() {}

    public RestoreDatabaseResponse(String message) {
        this.message = message;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
