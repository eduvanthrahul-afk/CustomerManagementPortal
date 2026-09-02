package com.verdant.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ServiceRequestDTO {

    public record ServiceRequestInput(
            @NotNull(message = "Customer ID is required")
            Long customerId,
            Long projectId,

            @NotBlank(message = "Issue title is required")
            String issue,

            String description,
            String priority,
            String status,
            Long assignedUserId,
            LocalDate dueDate,
            String resolution,
            String notes
    ) {}

    public record ServiceResponse(
            Long id,
            String ticketCode,
            Long customerId,
            String customerName,
            Long projectId,
            String projectName,
            String issue,
            String description,
            String priority,
            String status,
            Long assignedUserId,
            String assignedUserName,
            LocalDate dueDate,
            String resolution,
            String notes,
            OffsetDateTime createdAt
    ) {}
}
