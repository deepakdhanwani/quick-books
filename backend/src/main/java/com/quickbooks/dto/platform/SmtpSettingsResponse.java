package com.quickbooks.dto.platform;

import com.quickbooks.entity.PlatformSettings;

import java.time.OffsetDateTime;

public class SmtpSettingsResponse {

    private boolean enabled;
    private String host;
    private Integer port;
    private String username;
    private boolean passwordConfigured;
    private String fromEmail;
    private String fromName;
    private boolean useTls;
    private boolean useSsl;
    private OffsetDateTime updatedAt;

    public static SmtpSettingsResponse from(PlatformSettings settings) {
        SmtpSettingsResponse response = new SmtpSettingsResponse();
        response.setEnabled(settings.isSmtpEnabled());
        response.setHost(settings.getSmtpHost());
        response.setPort(settings.getSmtpPort());
        response.setUsername(settings.getSmtpUsername());
        response.setPasswordConfigured(settings.getSmtpPassword() != null && !settings.getSmtpPassword().isBlank());
        response.setFromEmail(settings.getSmtpFromEmail());
        response.setFromName(settings.getSmtpFromName());
        response.setUseTls(settings.isSmtpUseTls());
        response.setUseSsl(settings.isSmtpUseSsl());
        response.setUpdatedAt(settings.getUpdatedAt());
        return response;
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public boolean isPasswordConfigured() { return passwordConfigured; }
    public void setPasswordConfigured(boolean passwordConfigured) { this.passwordConfigured = passwordConfigured; }
    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }
    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }
    public boolean isUseTls() { return useTls; }
    public void setUseTls(boolean useTls) { this.useTls = useTls; }
    public boolean isUseSsl() { return useSsl; }
    public void setUseSsl(boolean useSsl) { this.useSsl = useSsl; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
