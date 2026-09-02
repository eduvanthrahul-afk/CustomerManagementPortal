package com.verdant.crm.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class PaymentDTO {

    public record PaymentRequest(
            @NotNull(message = "Customer ID is required")
            Long customerId,
            Long projectId,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be positive")
            BigDecimal amount,

            LocalDate paymentDate,

            @NotNull(message = "Due date is required")
            LocalDate dueDate,

            String paymentMethod,
            String status,
            String referenceNumber,
            String notes
    ) {}

    public record PaymentResponse(
            Long id,
            String paymentCode,
            Long customerId,
            String customerName,
            Long projectId,
            String projectName,
            BigDecimal amount,
            LocalDate paymentDate,
            LocalDate dueDate,
            String paymentMethod,
            String status,
            String referenceNumber,
            String notes,
            boolean isOverdue,
            OffsetDateTime createdAt
    ) {}
}
