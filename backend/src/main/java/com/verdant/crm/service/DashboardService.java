package com.verdant.crm.service;

import com.verdant.crm.dto.ActivityDTO.ActivityResponse;
import com.verdant.crm.dto.DashboardStatsDTO.*;
import com.verdant.crm.entity.*;
import com.verdant.crm.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final QuoteRepository quoteRepository;
    private final LeadRepository leadRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final SiteSurveyRepository surveyRepository;
    private final ActivityService activityService;

    public DashboardService(QuoteRepository quoteRepository,
                            LeadRepository leadRepository,
                            PaymentRepository paymentRepository,
                            ProjectRepository projectRepository,
                            SiteSurveyRepository surveyRepository,
                            ActivityService activityService) {
        this.quoteRepository = quoteRepository;
        this.leadRepository = leadRepository;
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
        this.surveyRepository = surveyRepository;
        this.activityService = activityService;
    }

    public DashboardOverviewResponse getDashboardOverview() {
        LocalDate today = LocalDate.now();

        // 1. Revenue Asking for Attention (at Risk) Metrics
        long unfollowedQuotesCount = quoteRepository.countUnfollowedQuotes();
        BigDecimal unfollowedQuotesAmount = quoteRepository.sumAmountUnfollowedQuotes();

        long leadsNotContactedCount = leadRepository.countUncontactedLeads();

        long overduePaymentsCount = paymentRepository.countOverduePayments(today);
        BigDecimal overduePaymentsAmount = paymentRepository.sumOverduePayments(today);

        long delayedProjectsCount = projectRepository.countByStatus("DELAYED");
        BigDecimal delayedProjectsBudget = projectRepository.sumBudgetDelayedProjects();

        long lowMarginQuotesCount = quoteRepository.countLowMarginQuotes();

        BigDecimal totalAtRisk = unfollowedQuotesAmount
                .add(overduePaymentsAmount)
                .add(delayedProjectsBudget);

        RevenueRiskSummary revenueRisk = new RevenueRiskSummary(
                totalAtRisk,
                unfollowedQuotesCount,
                unfollowedQuotesAmount,
                leadsNotContactedCount,
                overduePaymentsCount,
                overduePaymentsAmount,
                delayedProjectsCount,
                delayedProjectsBudget,
                lowMarginQuotesCount
        );

        // 2. CRM Pipeline Stages
        List<PipelineStage> pipeline = new ArrayList<>();
        pipeline.add(new PipelineStage(
                "INCOMING",
                "Incoming",
                1,
                leadRepository.countByStatus("NEW"),
                BigDecimal.ZERO,
                "/leads?status=NEW"
        ));
        pipeline.add(new PipelineStage(
                "ONSITE",
                "On-site",
                2,
                surveyRepository.countByStatus("SCHEDULED"),
                BigDecimal.ZERO,
                "/surveys?status=SCHEDULED"
        ));
        pipeline.add(new PipelineStage(
                "QUOTED",
                "Quoted",
                3,
                unfollowedQuotesCount,
                unfollowedQuotesAmount,
                "/quotes?status=SENT"
        ));
        pipeline.add(new PipelineStage(
                "INFLIGHT",
                "In Flight",
                4,
                projectRepository.countByStatus("IN_PROGRESS") + delayedProjectsCount,
                BigDecimal.ZERO,
                "/projects?status=IN_PROGRESS"
        ));
        pipeline.add(new PipelineStage(
                "COLLECTIONS",
                "Collections",
                5,
                paymentRepository.countByStatus("DUE") + overduePaymentsCount,
                overduePaymentsAmount,
                "/payments?status=OVERDUE"
        ));

        // 3. Needs Your Decision Items
        List<DecisionItem> decisions = new ArrayList<>();

        // Overdue payments needing collections outreach
        List<Payment> overdueList = paymentRepository.findOverduePaymentsList(today, PageRequest.of(0, 3));
        for (Payment pay : overdueList) {
            decisions.add(new DecisionItem(
                    "pay-" + pay.getId(),
                    "PAYMENT",
                    pay.getId(),
                    pay.getCustomer().getName(),
                    "Invoice " + pay.getPaymentCode() + " overdue",
                    "Payment past due date (" + pay.getDueDate() + ")",
                    pay.getAmount(),
                    "OVERDUE",
                    "danger",
                    "Collect Payment",
                    "Send Reminder"
            ));
        }

        // Quotes pending follow up or low margin
        List<Quote> quotesNeedingAction = quoteRepository.findQuotesNeedingDecision(PageRequest.of(0, 3));
        for (Quote q : quotesNeedingAction) {
            boolean isLowMargin = q.getCalculatedMarginPercentage().compareTo(BigDecimal.valueOf(15)) < 0;
            decisions.add(new DecisionItem(
                    "quote-" + q.getId(),
                    "QUOTE",
                    q.getId(),
                    q.getCustomer().getName() + " — " + q.getProjectType(),
                    "Quote " + q.getQuoteNumber() + " (" + q.getStatus() + ")",
                    isLowMargin ? "Low margin warning (" + q.getCalculatedMarginPercentage() + "%)" : "Proposal awaiting client signoff",
                    q.getAmount(),
                    q.getStatus(),
                    isLowMargin ? "warning" : "info",
                    "Follow Up",
                    "Revise Quote"
            ));
        }

        // Delayed projects
        List<Project> delayedProjects = projectRepository.findDelayedProjects();
        for (Project prj : delayedProjects) {
            decisions.add(new DecisionItem(
                    "proj-" + prj.getId(),
                    "PROJECT",
                    prj.getId(),
                    prj.getProjectName(),
                    prj.getCustomer().getName() + " (" + prj.getProjectNumber() + ")",
                    "Project delayed. Target was " + prj.getExpectedCompletion(),
                    prj.getBudget(),
                    "DELAYED",
                    "warning",
                    "Review Timeline",
                    "Reassign Staff"
            ));
        }

        // 4. Movement Today
        List<ActivityResponse> movementToday = activityService.getRecentActivities(8);

        // 5. On The Ground Schedule
        List<ScheduleItem> scheduleItems = surveyRepository.findUpcomingSurveys(today.minusDays(1), PageRequest.of(0, 6))
                .stream()
                .map(s -> new ScheduleItem(
                        s.getId(),
                        s.getSurveyCode(),
                        s.getSurveyDate(),
                        s.getSurveyTime() != null ? s.getSurveyTime() : "10:00 AM",
                        s.getCustomer().getName(),
                        s.getAddress(),
                        s.getAssignedUser() != null ? s.getAssignedUser().getFullName() : "Unassigned",
                        s.getStatus()
                ))
                .collect(Collectors.toList());

        return new DashboardOverviewResponse(revenueRisk, pipeline, decisions, movementToday, scheduleItems);
    }
}
