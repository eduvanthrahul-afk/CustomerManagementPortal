package com.verdant.crm.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class LeadDTO {

    public record LeadRequest(
            @NotBlank(message = "Lead name is required")
            String name,
            String email,
            String phone,
            String company,
            String source,
            String location,
            String requirement,
            BigDecimal estimatedValue,
            String status,
            Long assignedUserId,
            Long customerId,
            String notes
    ) {}

    public record LeadResponse(
            Long id,
            String leadCode,
            String name,
            String email,
            String phone,
            String company,
            String source,
            String location,
            String requirement,
            BigDecimal estimatedValue,
            String status,
            Long assignedUserId,
            String assignedUserName,
            Long customerId,
            String customerName,
            OffsetDateTime lastContactedAt,
            String notes,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}
}
