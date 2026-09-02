package com.verdant.crm.controller;

import com.verdant.crm.dto.SiteSurveyDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.SiteSurveyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/surveys")
public class SiteSurveyController {

    private final SiteSurveyService surveyService;
    private final AuthService authService;

    public SiteSurveyController(SiteSurveyService surveyService, AuthService authService) {
        this.surveyService = surveyService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<SiteSurveyResponse>> getSurveys(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "surveyDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(surveyService.getSurveys(search, status, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SiteSurveyResponse> getSurveyById(@PathVariable Long id) {
        return ResponseEntity.ok(surveyService.getSurveyById(id));
    }

    @PostMapping
    public ResponseEntity<SiteSurveyResponse> createSurvey(@Valid @RequestBody SiteSurveyRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(surveyService.createSurvey(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SiteSurveyResponse> updateSurvey(@PathVariable Long id, @Valid @RequestBody SiteSurveyRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(surveyService.updateSurvey(id, request, currentUser));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SiteSurveyResponse> completeSurvey(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        User currentUser = authService.getCurrentUserEntity();
        String measurements = body != null ? body.get("measurements") : null;
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(surveyService.completeSurvey(id, measurements, notes, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteSurvey(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        surveyService.deleteSurvey(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Survey deleted successfully"));
    }
}
