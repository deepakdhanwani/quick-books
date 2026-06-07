package com.quickbooks.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Admin admin = new Admin();
    private final Cors cors = new Cors();
    private final Storage storage = new Storage();
    private final Database database = new Database();

    public Jwt getJwt() { return jwt; }
    public Admin getAdmin() { return admin; }
    public Cors getCors() { return cors; }
    public Storage getStorage() { return storage; }
    public Database getDatabase() { return database; }

    public static class Jwt {
        private String secret;
        private long expirationMs = 86400000;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }

    public static class Admin {
        private boolean autoCreate = true;
        private String email;
        private String password;
        private String name = "Platform Admin";

        public boolean isAutoCreate() { return autoCreate; }
        public void setAutoCreate(boolean autoCreate) { this.autoCreate = autoCreate; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:9091,http://localhost:9092";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Storage {
        private String uploadDir = "uploads";

        public String getUploadDir() { return uploadDir; }
        public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }
    }

    public static class Database {
        private String backupDir = "backups";
        private String pgDumpCommand = "pg_dump";
        private String psqlCommand = "psql";

        public String getBackupDir() { return backupDir; }
        public void setBackupDir(String backupDir) { this.backupDir = backupDir; }
        public String getPgDumpCommand() { return pgDumpCommand; }
        public void setPgDumpCommand(String pgDumpCommand) { this.pgDumpCommand = pgDumpCommand; }
        public String getPsqlCommand() { return psqlCommand; }
        public void setPsqlCommand(String psqlCommand) { this.psqlCommand = psqlCommand; }
    }
}
