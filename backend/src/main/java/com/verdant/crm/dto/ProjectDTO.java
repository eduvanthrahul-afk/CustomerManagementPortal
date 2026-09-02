package com.verdant.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ProjectDTO {

    public record ProjectRequest(
            @NotNull(message = "Customer ID is required")
            Long customerId,
            Long quoteId,

            @NotBlank(message = "Project name is required")
            String projectName,

            String location,
            LocalDate startDate,
            LocalDate expectedCompletion,
            LocalDate actualCompletion,
            Long assignedUserId,
            String status,
            BigDecimal budget,
            Integer progressPercentage,
            String notes
    ) {}

    public record ProjectResponse(
            Long id,
            String projectNumber,
            Long customerId,
            String customerName,
            Long quoteId,
            String quoteNumber,
            String projectName,
            String location,
            LocalDate startDate,
            LocalDate expectedCompletion,
            LocalDate actualCompletion,
            Long assignedUserId,
            String assignedUserName,
            String status,
            BigDecimal budget,
            Integer progressPercentage,
            String notes,
            OffsetDateTime createdAt
    ) {}
}
