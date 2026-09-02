package com.verdant.crm.controller;

import com.verdant.crm.dto.PaymentDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.PaymentService;
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
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthService authService;

    public PaymentController(PaymentService paymentService, AuthService authService) {
        this.paymentService = paymentService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> getPayments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(paymentService.getPayments(search, status, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PaymentResponse>> getAllPaymentsList() {
        return ResponseEntity.ok(paymentService.getAllPaymentsList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(paymentService.createPayment(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentResponse> updatePayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(paymentService.updatePayment(id, request, currentUser));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResponse> markAsPaid(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User currentUser = authService.getCurrentUserEntity();
        String method = body != null ? body.get("paymentMethod") : "Bank Transfer";
        String reference = body != null ? body.get("referenceNumber") : null;
        return ResponseEntity.ok(paymentService.markAsPaid(id, method, reference, currentUser));
    }

    @PostMapping("/batch-import")
    public ResponseEntity<com.verdant.crm.dto.BatchDataDTO.BatchImportResult> batchImport(@RequestBody List<PaymentRequest> requests) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(paymentService.batchImportPayments(requests, currentUser));
    }

    @PostMapping("/bulk-action")
    public ResponseEntity<Map<String, String>> bulkAction(@RequestBody com.verdant.crm.dto.BatchDataDTO.BulkActionRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        paymentService.executeBulkAction(request, currentUser);
        return ResponseEntity.ok(Map.of("message", "Bulk action executed successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deletePayment(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        paymentService.deletePayment(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Payment deleted successfully"));
    }
}

