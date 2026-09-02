package com.verdant.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DashboardStatsDTO {

    public record RevenueRiskSummary(
            BigDecimal totalAtRisk,
            long unfollowedQuotesCount,
            BigDecimal unfollowedQuotesAmount,
            long leadsNotContactedCount,
            long overduePaymentsCount,
            BigDecimal overduePaymentsAmount,
            long delayedProjectsCount,
            BigDecimal delayedProjectsBudget,
            long lowMarginQuotesCount
    ) {}

    public record PipelineStage(
            String stageKey,
            String label,
            int order,
            long count,
            BigDecimal totalValue,
            String targetRoute
    ) {}

    public record DecisionItem(
            String id,
            String recordType, // QUOTE, LEAD, PAYMENT, PROJECT
            Long recordId,
            String title,
            String subtitle,
            String reason,
            BigDecimal amount,
            String status,
            String badgeType, // danger, warning, info
            String primaryAction,
            String secondaryAction
    ) {}

    public record ScheduleItem(
            Long id,
            String surveyCode,
            LocalDate date,
            String time,
            String customerName,
            String location,
            String assignedStaffName,
            String status
    ) {}

    public record DashboardOverviewResponse(
            RevenueRiskSummary revenueRisk,
            List<PipelineStage> pipeline,
            List<DecisionItem> decisionsNeeded,
            List<ActivityDTO.ActivityResponse> movementToday,
            List<ScheduleItem> onTheGround
    ) {}
}
