package com.quickbooks.dto.settings;

import jakarta.validation.constraints.NotBlank;

public class TruncateTransactionalRequest {

    public static final String CONFIRM_PHRASE = "TRUNCATE TRANSACTIONAL DATA";

    @NotBlank
    private String confirmPhrase;

    public String getConfirmPhrase() { return confirmPhrase; }
    public void setConfirmPhrase(String confirmPhrase) { this.confirmPhrase = confirmPhrase; }
}
