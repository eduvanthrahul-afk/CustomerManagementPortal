package com.verdant.crm.controller;

import com.verdant.crm.dto.CustomerDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.CustomerService;
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
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final AuthService authService;

    public CustomerController(CustomerService customerService, AuthService authService) {
        this.customerService = customerService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<CustomerResponse>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(customerService.getCustomers(search, status, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CustomerResponse>> getAllCustomersList() {
        return ResponseEntity.ok(customerService.getAllCustomersList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/{id}/360")
    public ResponseEntity<CustomerDetailResponse> getCustomer360Detail(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomer360Detail(id));
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(customerService.createCustomer(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(customerService.updateCustomer(id, request, currentUser));
    }

    @PostMapping("/batch-import")
    public ResponseEntity<com.verdant.crm.dto.BatchDataDTO.BatchImportResult> batchImport(@RequestBody List<CustomerRequest> requests) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(customerService.batchImportCustomers(requests, currentUser));
    }

    @PostMapping("/bulk-action")
    public ResponseEntity<Map<String, String>> bulkAction(@RequestBody com.verdant.crm.dto.BatchDataDTO.BulkActionRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        customerService.executeBulkAction(request, currentUser);
        return ResponseEntity.ok(Map.of("message", "Bulk action executed successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        customerService.deleteCustomer(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }
}

