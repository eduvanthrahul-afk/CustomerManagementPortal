package com.verdant.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTO {

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
            String password,

            String role,
            String title,
            String department
    ) {}

    public record AuthResponse(
            String token,
            String tokenType,
            UserDTO user
    ) {
        public static AuthResponse of(String token, UserDTO user) {
            return new AuthResponse(token, "Bearer", user);
        }
    }

    public record UserDTO(
            Long id,
            String fullName,
            String email,
            String role,
            String avatarUrl,
            String title,
            String department
    ) {}
}
