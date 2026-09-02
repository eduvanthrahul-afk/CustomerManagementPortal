package com.verdant.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class SiteSurveyDTO {

    public record SiteSurveyRequest(
            @NotNull(message = "Customer ID is required")
            Long customerId,
            Long leadId,

            @NotBlank(message = "Address is required")
            String address,

            @NotNull(message = "Survey date is required")
            LocalDate surveyDate,

            String surveyTime,
            Long assignedUserId,
            String status,
            String measurements,
            String notes
    ) {}

    public record SiteSurveyResponse(
            Long id,
            String surveyCode,
            Long customerId,
            String customerName,
            Long leadId,
            String leadName,
            String address,
            LocalDate surveyDate,
            String surveyTime,
            Long assignedUserId,
            String assignedUserName,
            String status,
            String measurements,
            String notes,
            OffsetDateTime createdAt
    ) {}
}
