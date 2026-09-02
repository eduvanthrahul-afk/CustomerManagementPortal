package com.verdant.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class CustomerDTO {

    public record CustomerRequest(
            @NotBlank(message = "Customer name is required")
            String name,
            String company,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            String phone,
            String address,
            String city,
            String status,
            String notes
    ) {}

    public record CustomerResponse(
            Long id,
            String customerCode,
            String name,
            String company,
            String email,
            String phone,
            String address,
            String city,
            BigDecimal totalValue,
            String status,
            LocalDate customerSince,
            String notes,
            OffsetDateTime createdAt
    ) {}

    public record CustomerDetailResponse(
            CustomerResponse customer,
            List<LeadDTO.LeadResponse> leads,
            List<SiteSurveyDTO.SiteSurveyResponse> surveys,
            List<QuoteDTO.QuoteResponse> quotes,
            List<ProjectDTO.ProjectResponse> projects,
            List<PaymentDTO.PaymentResponse> payments,
            List<ServiceRequestDTO.ServiceResponse> serviceRequests
    ) {}
}
