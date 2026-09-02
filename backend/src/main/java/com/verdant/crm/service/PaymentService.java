package com.verdant.crm.service;

import com.verdant.crm.dto.PaymentDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Payment;
import com.verdant.crm.entity.Project;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.PaymentRepository;
import com.verdant.crm.repository.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final ProjectRepository projectRepository;
    private final ActivityService activityService;

    public PaymentService(PaymentRepository paymentRepository,
                          CustomerRepository customerRepository,
                          ProjectRepository projectRepository,
                          ActivityService activityService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.projectRepository = projectRepository;
        this.activityService = activityService;
    }

    public Page<PaymentResponse> getPayments(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return paymentRepository.searchPayments(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    public List<PaymentResponse> getAllPaymentsList() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return mapToResponse(p);
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest req, User currentUser) {
        Customer customer = customerRepository.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.customerId()));

        Payment p = new Payment();
        p.setPaymentCode("PAY-" + (int)(Math.random() * 900 + 100));
        p.setCustomer(customer);
        p.setAmount(req.amount());
        p.setPaymentDate(req.paymentDate());
        p.setDueDate(req.dueDate());
        p.setPaymentMethod(req.paymentMethod() != null ? req.paymentMethod() : "Bank Transfer");

        String computedStatus = req.status();
        if (computedStatus == null || computedStatus.isBlank()) {
            if (req.paymentDate() != null) {
                computedStatus = "PAID";
            } else if (req.dueDate().isBefore(LocalDate.now())) {
                computedStatus = "OVERDUE";
            } else {
                computedStatus = "DUE";
            }
        }
        p.setStatus(computedStatus);
        p.setReferenceNumber(req.referenceNumber() != null ? req.referenceNumber() : "INV-2026-" + (int)(Math.random() * 9000 + 1000));
        p.setNotes(req.notes());

        if (req.projectId() != null) {
            projectRepository.findById(req.projectId()).ifPresent(p::setProject);
        }

        Payment saved = paymentRepository.save(p);

        activityService.logActivity(
                currentUser,
                "PAYMENT_RECORDED",
                "PAYMENT",
                saved.getId(),
                "Payment invoice created (" + saved.getPaymentCode() + ")",
                "₹" + saved.getAmount() + " invoice created for " + saved.getCustomer().getName() + " (Status: " + saved.getStatus() + ")",
                "credit-card",
                "PAID".equals(saved.getStatus()) ? "success" : "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse updatePayment(Long id, PaymentRequest req, User currentUser) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(p::setCustomer);
        }
        if (req.projectId() != null) {
            projectRepository.findById(req.projectId()).ifPresent(p::setProject);
        } else {
            p.setProject(null);
        }

        p.setAmount(req.amount());
        p.setPaymentDate(req.paymentDate());
        p.setDueDate(req.dueDate());
        if (req.paymentMethod() != null) p.setPaymentMethod(req.paymentMethod());
        if (req.status() != null) p.setStatus(req.status());
        if (req.referenceNumber() != null) p.setReferenceNumber(req.referenceNumber());
        p.setNotes(req.notes());

        Payment saved = paymentRepository.save(p);

        activityService.logActivity(
                currentUser,
                "PAYMENT_UPDATED",
                "PAYMENT",
                saved.getId(),
                "Payment " + saved.getPaymentCode() + " updated",
                "₹" + saved.getAmount() + " for " + saved.getCustomer().getName() + " (Status: " + saved.getStatus() + ")",
                "edit",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse markAsPaid(Long id, String paymentMethod, String referenceNumber, User currentUser) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        p.setStatus("PAID");
        p.setPaymentDate(LocalDate.now());
        if (paymentMethod != null) p.setPaymentMethod(paymentMethod);
        if (referenceNumber != null) p.setReferenceNumber(referenceNumber);

        Payment saved = paymentRepository.save(p);

        activityService.logActivity(
                currentUser,
                "PAYMENT_RECEIVED",
                "PAYMENT",
                saved.getId(),
                "Payment received (₹" + saved.getAmount() + ")",
                saved.getCustomer().getName() + " cleared invoice " + saved.getPaymentCode() + " (" + saved.getReferenceNumber() + ")",
                "dollar-sign",
                "success"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deletePayment(Long id, User currentUser) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "PAYMENT_DELETED",
                "PAYMENT",
                p.getId(),
                "Payment record deleted",
                "Removed " + p.getPaymentCode(),
                "trash-2",
                "danger"
        );

        paymentRepository.delete(p);
    }

    @Transactional
    public com.verdant.crm.dto.BatchDataDTO.BatchImportResult batchImportPayments(List<PaymentRequest> requests, User currentUser) {
        int success = 0;
        int failure = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            PaymentRequest req = requests.get(i);
            try {
                if (req.customerId() == null) {
                    failure++;
                    errors.add("Row " + (i + 1) + ": Customer ID is required");
                    continue;
                }
                if (req.amount() == null || req.amount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    failure++;
                    errors.add("Row " + (i + 1) + ": Valid amount is required");
                    continue;
                }
                createPayment(req, currentUser);
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
                paymentRepository.findById(id).ifPresent(p -> {
                    activityService.logActivity(currentUser, "PAYMENT_DELETED", "PAYMENT", p.getId(), "Payment deleted (bulk)", "Removed " + p.getPaymentCode(), "trash-2", "danger");
                    paymentRepository.delete(p);
                });
            }
        } else if ("UPDATE_STATUS".equalsIgnoreCase(req.action()) && req.statusValue() != null) {
            for (Long id : req.ids()) {
                paymentRepository.findById(id).ifPresent(p -> {
                    p.setStatus(req.statusValue());
                    if ("PAID".equalsIgnoreCase(req.statusValue()) && p.getPaymentDate() == null) {
                        p.setPaymentDate(LocalDate.now());
                    }
                    paymentRepository.save(p);
                });
            }
            activityService.logActivity(currentUser, "PAYMENT_BULK_UPDATE", "PAYMENT", null, "Bulk status updated", "Updated status to " + req.statusValue() + " for " + req.ids().size() + " payments", "check-circle", "info");
        }
    }

    public PaymentResponse mapToResponse(Payment p) {
        if (p == null) return null;
        boolean overdue = p.isOverdue();
        return new PaymentResponse(
                p.getId(),
                p.getPaymentCode(),
                p.getCustomer() != null ? p.getCustomer().getId() : null,
                p.getCustomer() != null ? p.getCustomer().getName() : "Unknown",
                p.getProject() != null ? p.getProject().getId() : null,
                p.getProject() != null ? p.getProject().getProjectName() : null,
                p.getAmount(),
                p.getPaymentDate(),
                p.getDueDate(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getReferenceNumber(),
                p.getNotes(),
                overdue,
                p.getCreatedAt()
        );
    }
}

