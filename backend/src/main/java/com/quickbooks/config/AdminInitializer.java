package com.quickbooks.config;

import com.quickbooks.entity.Admin;
import com.quickbooks.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

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
        if (!appProperties.getAdmin().isAutoCreate() || adminRepository.count() > 0) {
            return;
        }

        String email = appProperties.getAdmin().getEmail();
        String password = appProperties.getAdmin().getPassword();
        String name = appProperties.getAdmin().getName();

        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            log.warn("Admin auto-create is enabled but ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env — skipping admin creation.");
            return;
        }

        Admin admin = new Admin();
        admin.setEmail(email.trim());
        admin.setName(StringUtils.hasText(name) ? name.trim() : "Platform Admin");
        admin.setPasswordHash(passwordEncoder.encode(password));
        adminRepository.save(admin);

        log.info("=================================================");
        log.info("  ADMIN ACCOUNT CREATED (from .env properties)");
        log.info("  Email: {}", email);
        log.info("=================================================");
    }
}
