package com.verdant.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class QuoteDTO {

    public record QuoteRequest(
            @NotNull(message = "Customer ID is required")
            Long customerId,
            Long leadId,

            @NotBlank(message = "Project type is required")
            String projectType,

            String description,

            @NotNull(message = "Amount is required")
            @PositiveOrZero(message = "Amount must be zero or positive")
            BigDecimal amount,

            @NotNull(message = "Cost is required")
            @PositiveOrZero(message = "Cost must be zero or positive")
            BigDecimal cost,

            String status,
            LocalDate validUntil,
            Long assignedUserId,
            String notes
    ) {}

    public record QuoteResponse(
            Long id,
            String quoteNumber,
            Long customerId,
            String customerName,
            Long leadId,
            String leadName,
            String projectType,
            String description,
            BigDecimal amount,
            BigDecimal cost,
            BigDecimal margin,
            BigDecimal marginPercentage,
            String status,
            LocalDate validUntil,
            Long assignedUserId,
            String assignedUserName,
            String notes,
            boolean isLowMargin,
            OffsetDateTime createdAt
    ) {}
}
