package com.verdant.crm.service;

import com.verdant.crm.dto.LeadDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Lead;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.LeadRepository;
import com.verdant.crm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public LeadService(LeadRepository leadRepository,
                       CustomerRepository customerRepository,
                       UserRepository userRepository,
                       ActivityService activityService) {
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    public Page<LeadResponse> getLeads(String search, String status, Long assignedId, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return leadRepository.searchLeads(cleanSearch, cleanStatus, assignedId, pageable)
                .map(this::mapToResponse);
    }

    public List<LeadResponse> getAllLeadsList() {
        return leadRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LeadResponse getLeadById(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
        return mapToResponse(lead);
    }

    @Transactional
    public LeadResponse createLead(LeadRequest req, User currentUser) {
        Lead lead = new Lead();
        lead.setLeadCode("LEAD-" + (int)(Math.random() * 900 + 100));
        lead.setName(req.name());
        lead.setEmail(req.email());
        lead.setPhone(req.phone());
        lead.setCompany(req.company());
        lead.setSource(req.source() != null ? req.source() : "Website");
        lead.setLocation(req.location());
        lead.setRequirement(req.requirement());
        lead.setEstimatedValue(req.estimatedValue() != null ? req.estimatedValue() : BigDecimal.ZERO);
        lead.setStatus(req.status() != null ? req.status() : "NEW");
        lead.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(lead::setAssignedUser);
        } else if (currentUser != null) {
            lead.setAssignedUser(currentUser);
        }

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(lead::setCustomer);
        }

        Lead saved = leadRepository.save(lead);

        activityService.logActivity(
                currentUser,
                "LEAD_CREATED",
                "LEAD",
                saved.getId(),
                "New lead created",
                "" + saved.getName() + " (" + (saved.getCompany() != null ? saved.getCompany() : "Inbound") + ") - Est. ₹" + saved.getEstimatedValue(),
                "user-plus",
                "success"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public LeadResponse updateLead(Long id, LeadRequest req, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        lead.setName(req.name());
        lead.setEmail(req.email());
        lead.setPhone(req.phone());
        lead.setCompany(req.company());
        if (req.source() != null) lead.setSource(req.source());
        lead.setLocation(req.location());
        lead.setRequirement(req.requirement());
        if (req.estimatedValue() != null) lead.setEstimatedValue(req.estimatedValue());
        if (req.status() != null) lead.setStatus(req.status());
        lead.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(lead::setAssignedUser);
        } else {
            lead.setAssignedUser(null);
        }

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(lead::setCustomer);
        } else {
            lead.setCustomer(null);
        }

        Lead saved = leadRepository.save(lead);

        activityService.logActivity(
                currentUser,
                "LEAD_UPDATED",
                "LEAD",
                saved.getId(),
                "Lead updated",
                "Updated details for " + saved.getName() + " (Status: " + saved.getStatus() + ")",
                "edit",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public LeadResponse updateStatus(Long id, String status, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        lead.setStatus(status);
        lead.setLastContactedAt(OffsetDateTime.now());
        Lead saved = leadRepository.save(lead);

        activityService.logActivity(
                currentUser,
                "LEAD_STATUS_CHANGED",
                "LEAD",
                saved.getId(),
                "Lead status changed to " + status,
                saved.getName() + " is now marked as " + status,
                "arrow-right-circle",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public LeadResponse markContacted(Long id, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        lead.setLastContactedAt(OffsetDateTime.now());
        if ("NEW".equals(lead.getStatus())) {
            lead.setStatus("CONTACTED");
        }
        Lead saved = leadRepository.save(lead);

        activityService.logActivity(
                currentUser,
                "LEAD_CONTACTED",
                "LEAD",
                saved.getId(),
                "Contacted lead",
                "Logged outreach with " + saved.getName(),
                "phone-call",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteLead(Long id, User currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "LEAD_DELETED",
                "LEAD",
                lead.getId(),
                "Lead deleted",
                "Removed " + lead.getName(),
                "trash-2",
                "danger"
        );

        leadRepository.delete(lead);
    }

    @Transactional
    public com.verdant.crm.dto.BatchDataDTO.BatchImportResult batchImportLeads(List<LeadRequest> requests, User currentUser) {
        int success = 0;
        int failure = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            LeadRequest req = requests.get(i);
            try {
                if (req.name() == null || req.name().trim().isEmpty()) {
                    failure++;
                    errors.add("Row " + (i + 1) + ": Name is required");
                    continue;
                }
                createLead(req, currentUser);
                success++;
            } catch (Exception e) {
                failure++;
                errors.add("Row " + (i + 1) + ": " + e.getMessage());
            }
        }

        return new com.verdant.crm.dto.BatchDataDTO.BatchImportResult(requests.size(), success, failure, errors);
    }

    @Transactional
    public void executeBulkAction(com.verdant.crm.dto.BatchDataDTO.BulkActionRequest req, User currentUser) {
        if (req.ids() == null || req.ids().isEmpty()) return;

        if ("DELETE".equalsIgnoreCase(req.action())) {
            for (Long id : req.ids()) {
                leadRepository.findById(id).ifPresent(l -> {
                    activityService.logActivity(currentUser, "LEAD_DELETED", "LEAD", l.getId(), "Lead deleted (bulk)", "Removed " + l.getName(), "trash-2", "danger");
                    leadRepository.delete(l);
                });
            }
        } else if ("UPDATE_STATUS".equalsIgnoreCase(req.action()) && req.statusValue() != null) {
            for (Long id : req.ids()) {
                leadRepository.findById(id).ifPresent(l -> {
                    l.setStatus(req.statusValue());
                    leadRepository.save(l);
                });
            }
            activityService.logActivity(currentUser, "LEAD_BULK_UPDATE", "LEAD", null, "Bulk status updated", "Updated status to " + req.statusValue() + " for " + req.ids().size() + " leads", "check-circle", "info");
        }
    }

    public LeadResponse mapToResponse(Lead l) {
        if (l == null) return null;
        return new LeadResponse(
                l.getId(),
                l.getLeadCode(),
                l.getName(),
                l.getEmail(),
                l.getPhone(),
                l.getCompany(),
                l.getSource(),
                l.getLocation(),
                l.getRequirement(),
                l.getEstimatedValue(),
                l.getStatus(),
                l.getAssignedUser() != null ? l.getAssignedUser().getId() : null,
                l.getAssignedUser() != null ? l.getAssignedUser().getFullName() : "Unassigned",
                l.getCustomer() != null ? l.getCustomer().getId() : null,
                l.getCustomer() != null ? l.getCustomer().getName() : null,
                l.getLastContactedAt(),
                l.getNotes(),
                l.getCreatedAt(),
                l.getUpdatedAt()
        );
    }
}

