package com.verdant.crm.config;

import com.verdant.crm.entity.User;
import com.verdant.crm.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initPasswords() {
        userRepository.findByEmail("admin@verdantcrm.com").ifPresent(admin -> {
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            userRepository.save(admin);
            logger.info("Admin password initialized for admin@verdantcrm.com");
        });

        userRepository.findByEmail("sarah.chen@verdantcrm.com").ifPresent(staff -> {
            staff.setPasswordHash(passwordEncoder.encode("Staff@123"));
            userRepository.save(staff);
            logger.info("Staff password initialized for sarah.chen@verdantcrm.com");
        });

        userRepository.findByEmail("marcus.vance@verdantcrm.com").ifPresent(staff -> {
            staff.setPasswordHash(passwordEncoder.encode("Staff@123"));
            userRepository.save(staff);
        });

        userRepository.findByEmail("elena.rostova@verdantcrm.com").ifPresent(staff -> {
            staff.setPasswordHash(passwordEncoder.encode("Staff@123"));
            userRepository.save(staff);
        });
    }
}
