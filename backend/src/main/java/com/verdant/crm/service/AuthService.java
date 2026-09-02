package com.verdant.crm.service;

import com.verdant.crm.dto.AuthDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.BadRequestException;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.UserRepository;
import com.verdant.crm.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final ActivityService activityService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       ActivityService activityService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.activityService = activityService;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.email()));

        return AuthResponse.of(jwt, mapToDTO(user));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already registered: " + request.email());
        }

        String role = (request.role() != null && request.role().equalsIgnoreCase("ADMIN")) ? "ADMIN" : "STAFF";

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setTitle(request.title() != null ? request.title() : (role.equals("ADMIN") ? "System Administrator" : "Account Representative"));
        user.setDepartment(request.department() != null ? request.department() : "Operations");
        user.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");

        User savedUser = userRepository.save(user);

        String jwt = tokenProvider.generateTokenFromEmail(savedUser.getEmail());

        activityService.logActivity(
                savedUser,
                "USER_REGISTERED",
                "USER",
                savedUser.getId(),
                "New user registered",
                savedUser.getFullName() + " created an account with role " + savedUser.getRole(),
                "user-plus",
                "info"
        );

        return AuthResponse.of(jwt, mapToDTO(savedUser));
    }

    public UserDTO getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) {
            throw new BadRequestException("No authenticated user");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));

        return mapToDTO(user);
    }

    public User getCurrentUserEntity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    public UserDTO mapToDTO(User user) {
        if (user == null) return null;
        return new UserDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getTitle(),
                user.getDepartment()
        );
    }
}
