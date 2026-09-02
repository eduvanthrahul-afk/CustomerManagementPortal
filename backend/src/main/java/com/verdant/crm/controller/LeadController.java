package com.verdant.crm.controller;

import com.verdant.crm.dto.LeadDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService leadService;
    private final AuthService authService;

    public LeadController(LeadService leadService, AuthService authService) {
        this.leadService = leadService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<LeadResponse>> getLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(leadService.getLeads(search, status, assignedId, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<LeadResponse>> getAllLeadsList() {
        return ResponseEntity.ok(leadService.getAllLeadsList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadResponse> getLeadById(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getLeadById(id));
    }

    @PostMapping
    public ResponseEntity<LeadResponse> createLead(@Valid @RequestBody LeadRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(leadService.createLead(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeadResponse> updateLead(@PathVariable Long id, @Valid @RequestBody LeadRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(leadService.updateLead(id, request, currentUser));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LeadResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User currentUser = authService.getCurrentUserEntity();
        String status = body.get("status");
        return ResponseEntity.ok(leadService.updateStatus(id, status, currentUser));
    }

    @PostMapping("/{id}/contact")
    public ResponseEntity<LeadResponse> markContacted(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(leadService.markContacted(id, currentUser));
    }

    @PostMapping("/batch-import")
    public ResponseEntity<com.verdant.crm.dto.BatchDataDTO.BatchImportResult> batchImport(@RequestBody List<LeadRequest> requests) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(leadService.batchImportLeads(requests, currentUser));
    }

    @PostMapping("/bulk-action")
    public ResponseEntity<Map<String, String>> bulkAction(@RequestBody com.verdant.crm.dto.BatchDataDTO.BulkActionRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        leadService.executeBulkAction(request, currentUser);
        return ResponseEntity.ok(Map.of("message", "Bulk action executed successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteLead(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        leadService.deleteLead(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Lead deleted successfully"));
    }
}

