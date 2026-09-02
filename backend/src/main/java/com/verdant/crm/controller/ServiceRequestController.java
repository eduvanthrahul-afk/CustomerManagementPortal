package com.verdant.crm.controller;

import com.verdant.crm.dto.ServiceRequestDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final AuthService authService;

    public ServiceRequestController(ServiceRequestService serviceRequestService, AuthService authService) {
        this.serviceRequestService = serviceRequestService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<ServiceResponse>> getServiceRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(serviceRequestService.getServiceRequests(search, status, priority, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponse> getServiceRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceRequestService.getServiceRequestById(id));
    }

    @PostMapping
    public ResponseEntity<ServiceResponse> createServiceRequest(@Valid @RequestBody ServiceRequestInput request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(serviceRequestService.createServiceRequest(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceResponse> updateServiceRequest(@PathVariable Long id, @Valid @RequestBody ServiceRequestInput request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(serviceRequestService.updateServiceRequest(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteServiceRequest(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        serviceRequestService.deleteServiceRequest(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Service request deleted successfully"));
    }
}
