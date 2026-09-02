package com.verdant.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDTO {

    public record GrowthKPIs(
            BigDecimal totalGrossPipeline,
            BigDecimal monthlyRevenueRealized,
            BigDecimal momRevenueGrowthRate,
            double winRatePercentage,
            double averageDealVelocityDays,
            BigDecimal projectedQuarterlyRevenue,
            BigDecimal totalCashCollected,
            BigDecimal outstandingReceivables
    ) {}

    public record MonthlyTrendPoint(
            String monthLabel,
            BigDecimal invoicedAmount,
            BigDecimal collectedAmount,
            BigDecimal pipelineForecast,
            BigDecimal trendlineValue
    ) {}

    public record FunnelStageMetric(
            String stageKey,
            String stageName,
            long count,
            BigDecimal totalValue,
            double conversionRateFromPrevious,
            double overallConversionRate
    ) {}

    public record WinLossMetric(
            long totalDealsClosed,
            long wonCount,
            long lostCount,
            double winRate,
            BigDecimal wonValue,
            BigDecimal lostValue,
            List<LossFactorItem> topLossReasons
    ) {}

    public record LossFactorItem(
            String reason,
            long count,
            double percentage
    ) {}

    public record AgingBucketItem(
            String bucketName,
            String severity,
            long invoiceCount,
            BigDecimal totalAmount,
            double percentageOfTotal
    ) {}

    public record MarginTrendPoint(
            String periodLabel,
            double averageMarginPercent,
            double targetMarginPercent,
            BigDecimal totalProfit,
            BigDecimal totalRevenue
    ) {}

    public record AnalyticsOverviewResponse(
            GrowthKPIs kpis,
            List<MonthlyTrendPoint> revenueTrends,
            List<FunnelStageMetric> funnelStages,
            WinLossMetric winLossStats,
            List<AgingBucketItem> agingBuckets,
            List<MarginTrendPoint> marginTrends
    ) {}
}
