package com.quickbooks.dto.platform;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateSmtpSettingsRequest {

    private Boolean enabled;

    @Size(max = 255)
    private String host;

    @Min(1)
    @Max(65535)
    private Integer port;

    @Size(max = 255)
    private String username;

    @Size(max = 500)
    private String password;

    @Email
    @Size(max = 255)
    private String fromEmail;

    @Size(max = 255)
    private String fromName;

    private Boolean useTls;
    private Boolean useSsl;

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }
    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }
    public Boolean getUseTls() { return useTls; }
    public void setUseTls(Boolean useTls) { this.useTls = useTls; }
    public Boolean getUseSsl() { return useSsl; }
    public void setUseSsl(Boolean useSsl) { this.useSsl = useSsl; }
}
