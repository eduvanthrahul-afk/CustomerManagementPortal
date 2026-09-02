package com.verdant.crm.service;

import com.verdant.crm.dto.SiteSurveyDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Lead;
import com.verdant.crm.entity.SiteSurvey;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.LeadRepository;
import com.verdant.crm.repository.SiteSurveyRepository;
import com.verdant.crm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SiteSurveyService {

    private final SiteSurveyRepository surveyRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public SiteSurveyService(SiteSurveyRepository surveyRepository,
                             CustomerRepository customerRepository,
                             LeadRepository leadRepository,
                             UserRepository userRepository,
                             ActivityService activityService) {
        this.surveyRepository = surveyRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    public Page<SiteSurveyResponse> getSurveys(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return surveyRepository.searchSurveys(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    public SiteSurveyResponse getSurveyById(Long id) {
        SiteSurvey s = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site survey not found with id: " + id));
        return mapToResponse(s);
    }

    @Transactional
    public SiteSurveyResponse createSurvey(SiteSurveyRequest req, User currentUser) {
        Customer customer = customerRepository.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.customerId()));

        SiteSurvey s = new SiteSurvey();
        s.setSurveyCode("SURV-" + (int)(Math.random() * 900 + 100));
        s.setCustomer(customer);
        s.setAddress(req.address());
        s.setSurveyDate(req.surveyDate());
        s.setSurveyTime(req.surveyTime() != null ? req.surveyTime() : "10:00 AM");
        s.setStatus(req.status() != null ? req.status() : "SCHEDULED");
        s.setMeasurements(req.measurements());
        s.setNotes(req.notes());

        if (req.leadId() != null) {
            leadRepository.findById(req.leadId()).ifPresent(s::setLead);
        }

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(s::setAssignedUser);
        } else if (currentUser != null) {
            s.setAssignedUser(currentUser);
        }

        SiteSurvey saved = surveyRepository.save(s);

        activityService.logActivity(
                currentUser,
                "SURVEY_SCHEDULED",
                "SURVEY",
                saved.getId(),
                "Site survey scheduled",
                "On-site survey booked for " + saved.getCustomer().getName() + " on " + saved.getSurveyDate(),
                "calendar",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public SiteSurveyResponse updateSurvey(Long id, SiteSurveyRequest req, User currentUser) {
        SiteSurvey s = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site survey not found with id: " + id));

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(s::setCustomer);
        }
        if (req.leadId() != null) {
            leadRepository.findById(req.leadId()).ifPresent(s::setLead);
        } else {
            s.setLead(null);
        }

        s.setAddress(req.address());
        s.setSurveyDate(req.surveyDate());
        s.setSurveyTime(req.surveyTime());
        if (req.status() != null) s.setStatus(req.status());
        s.setMeasurements(req.measurements());
        s.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(s::setAssignedUser);
        } else {
            s.setAssignedUser(null);
        }

        SiteSurvey saved = surveyRepository.save(s);

        activityService.logActivity(
                currentUser,
                "SURVEY_UPDATED",
                "SURVEY",
                saved.getId(),
                "Survey appointment updated",
                "Survey for " + saved.getCustomer().getName() + " updated (Status: " + saved.getStatus() + ")",
                "clipboard",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public SiteSurveyResponse completeSurvey(Long id, String measurements, String notes, User currentUser) {
        SiteSurvey s = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site survey not found with id: " + id));

        s.setStatus("COMPLETED");
        if (measurements != null) s.setMeasurements(measurements);
        if (notes != null) s.setNotes(notes);

        SiteSurvey saved = surveyRepository.save(s);

        activityService.logActivity(
                currentUser,
                "SURVEY_COMPLETED",
                "SURVEY",
                saved.getId(),
                "Site survey completed",
                "Measurements recorded at " + saved.getCustomer().getName() + " facility",
                "check-circle",
                "success"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteSurvey(Long id, User currentUser) {
        SiteSurvey s = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site survey not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "SURVEY_CANCELLED",
                "SURVEY",
                s.getId(),
                "Survey cancelled/deleted",
                "Removed survey for " + s.getCustomer().getName(),
                "trash-2",
                "warning"
        );

        surveyRepository.delete(s);
    }

    public SiteSurveyResponse mapToResponse(SiteSurvey s) {
        if (s == null) return null;
        return new SiteSurveyResponse(
                s.getId(),
                s.getSurveyCode(),
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getName() : "Unknown",
                s.getLead() != null ? s.getLead().getId() : null,
                s.getLead() != null ? s.getLead().getName() : null,
                s.getAddress(),
                s.getSurveyDate(),
                s.getSurveyTime(),
                s.getAssignedUser() != null ? s.getAssignedUser().getId() : null,
                s.getAssignedUser() != null ? s.getAssignedUser().getFullName() : "Unassigned",
                s.getStatus(),
                s.getMeasurements(),
                s.getNotes(),
                s.getCreatedAt()
        );
    }
}
