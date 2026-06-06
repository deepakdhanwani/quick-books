package com.quickbooks.config;

import com.quickbooks.entity.Admin;
import com.quickbooks.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class AdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public AdminInitializer(AdminRepository adminRepository, PasswordEncoder passwordEncoder, AppProperties appProperties) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!appProperties.getAdmin().isAutoGenerate() || adminRepository.count() > 0) {
            return;
        }

        String email = "admin@quickbooks.local";
        String password = generatePassword();

        Admin admin = new Admin();
        admin.setEmail(email);
        admin.setName("Platform Admin");
        admin.setPasswordHash(passwordEncoder.encode(password));
        adminRepository.save(admin);

        log.info("=================================================");
        log.info("  ADMIN ACCOUNT CREATED (save these credentials)");
        log.info("  Email:    {}", email);
        log.info("  Password: {}", password);
        log.info("=================================================");
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }
}
