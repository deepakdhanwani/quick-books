package com.quickbooks.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Admin admin = new Admin();
    private final Cors cors = new Cors();

    public Jwt getJwt() { return jwt; }
    public Admin getAdmin() { return admin; }
    public Cors getCors() { return cors; }

    public static class Jwt {
        private String secret;
        private long expirationMs = 86400000;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }

    public static class Admin {
        private boolean autoGenerate = true;

        public boolean isAutoGenerate() { return autoGenerate; }
        public void setAutoGenerate(boolean autoGenerate) { this.autoGenerate = autoGenerate; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:8081";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }
}
