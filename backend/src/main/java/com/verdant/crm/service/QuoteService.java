package com.verdant.crm.service;

import com.verdant.crm.dto.QuoteDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Quote;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.LeadRepository;
import com.verdant.crm.repository.QuoteRepository;
import com.verdant.crm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public QuoteService(QuoteRepository quoteRepository,
                        CustomerRepository customerRepository,
                        LeadRepository leadRepository,
                        UserRepository userRepository,
                        ActivityService activityService) {
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    public Page<QuoteResponse> getQuotes(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return quoteRepository.searchQuotes(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    public List<QuoteResponse> getAllQuotesList() {
        return quoteRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuoteResponse getQuoteById(Long id) {
        Quote q = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + id));
        return mapToResponse(q);
    }

    @Transactional
    public QuoteResponse createQuote(QuoteRequest req, User currentUser) {
        Customer customer = customerRepository.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.customerId()));

        Quote q = new Quote();
        q.setQuoteNumber("Q-2026-" + String.format("%03d", (int)(Math.random() * 900 + 100)));
        q.setCustomer(customer);
        q.setProjectType(req.projectType());
        q.setDescription(req.description());
        q.setAmount(req.amount());
        q.setCost(req.cost());
        q.setStatus(req.status() != null ? req.status() : "DRAFT");
        q.setValidUntil(req.validUntil());
        q.setNotes(req.notes());

        if (req.leadId() != null) {
            leadRepository.findById(req.leadId()).ifPresent(q::setLead);
        }

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(q::setAssignedUser);
        } else if (currentUser != null) {
            q.setAssignedUser(currentUser);
        }

        Quote saved = quoteRepository.save(q);

        activityService.logActivity(
                currentUser,
                "QUOTE_CREATED",
                "QUOTE",
                saved.getId(),
                "Proposal generated (" + saved.getQuoteNumber() + ")",
                "Quote for " + saved.getCustomer().getName() + " - ₹" + saved.getAmount() + " (Margin: " + saved.getCalculatedMarginPercentage() + "%)",
                "file-text",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public QuoteResponse updateQuote(Long id, QuoteRequest req, User currentUser) {
        Quote q = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + id));

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(q::setCustomer);
        }
        if (req.leadId() != null) {
            leadRepository.findById(req.leadId()).ifPresent(q::setLead);
        } else {
            q.setLead(null);
        }

        q.setProjectType(req.projectType());
        q.setDescription(req.description());
        q.setAmount(req.amount());
        q.setCost(req.cost());
        if (req.status() != null) q.setStatus(req.status());
        q.setValidUntil(req.validUntil());
        q.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(q::setAssignedUser);
        } else {
            q.setAssignedUser(null);
        }

        Quote saved = quoteRepository.save(q);

        activityService.logActivity(
                currentUser,
                "QUOTE_UPDATED",
                "QUOTE",
                saved.getId(),
                "Quote " + saved.getQuoteNumber() + " updated",
                "Updated amount to ₹" + saved.getAmount() + " (Status: " + saved.getStatus() + ")",
                "edit",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public QuoteResponse updateStatus(Long id, String status, User currentUser) {
        Quote q = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + id));

        q.setStatus(status);
        Quote saved = quoteRepository.save(q);

        String badge = "ACCEPTED".equals(status) ? "success" : ("REJECTED".equals(status) ? "danger" : "info");
        activityService.logActivity(
                currentUser,
                "QUOTE_STATUS_" + status,
                "QUOTE",
                saved.getId(),
                "Quote " + saved.getQuoteNumber() + " status: " + status,
                "Quote for " + saved.getCustomer().getName() + " transitioned to " + status,
                "check-square",
                badge
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteQuote(Long id, User currentUser) {
        Quote q = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "QUOTE_DELETED",
                "QUOTE",
                q.getId(),
                "Quote deleted",
                "Removed " + q.getQuoteNumber(),
                "trash-2",
                "danger"
        );

        quoteRepository.delete(q);
    }

    public QuoteResponse mapToResponse(Quote q) {
        if (q == null) return null;
        BigDecimal margin = q.getCalculatedMargin();
        BigDecimal marginPct = q.getCalculatedMarginPercentage();
        boolean lowMargin = (marginPct.compareTo(BigDecimal.valueOf(15)) < 0) && !"REJECTED".equalsIgnoreCase(q.getStatus());

        return new QuoteResponse(
                q.getId(),
                q.getQuoteNumber(),
                q.getCustomer() != null ? q.getCustomer().getId() : null,
                q.getCustomer() != null ? q.getCustomer().getName() : "Unknown",
                q.getLead() != null ? q.getLead().getId() : null,
                q.getLead() != null ? q.getLead().getName() : null,
                q.getProjectType(),
                q.getDescription(),
                q.getAmount(),
                q.getCost(),
                margin,
                marginPct,
                q.getStatus(),
                q.getValidUntil(),
                q.getAssignedUser() != null ? q.getAssignedUser().getId() : null,
                q.getAssignedUser() != null ? q.getAssignedUser().getFullName() : "Unassigned",
                q.getNotes(),
                lowMargin,
                q.getCreatedAt()
        );
    }
}
