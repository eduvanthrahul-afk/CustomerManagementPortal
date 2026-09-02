package com.verdant.crm.service;

import com.verdant.crm.dto.*;
import com.verdant.crm.dto.CustomerDTO.*;
import com.verdant.crm.entity.*;
import com.verdant.crm.exception.BadRequestException;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final SiteSurveyRepository surveyRepository;
    private final QuoteRepository quoteRepository;
    private final ProjectRepository projectRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceRequestRepository serviceRepository;
    private final ActivityService activityService;
    private final LeadService leadService;
    private final SiteSurveyService surveyService;
    private final QuoteService quoteService;
    private final ProjectService projectService;
    private final PaymentService paymentService;
    private final ServiceRequestService serviceRequestService;

    public CustomerService(CustomerRepository customerRepository,
                           LeadRepository leadRepository,
                           SiteSurveyRepository surveyRepository,
                           QuoteRepository quoteRepository,
                           ProjectRepository projectRepository,
                           PaymentRepository paymentRepository,
                           ServiceRequestRepository serviceRepository,
                           ActivityService activityService,
                           LeadService leadService,
                           SiteSurveyService surveyService,
                           QuoteService quoteService,
                           ProjectService projectService,
                           PaymentService paymentService,
                           ServiceRequestService serviceRequestService) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.surveyRepository = surveyRepository;
        this.quoteRepository = quoteRepository;
        this.projectRepository = projectRepository;
        this.paymentRepository = paymentRepository;
        this.serviceRepository = serviceRepository;
        this.activityService = activityService;
        this.leadService = leadService;
        this.surveyService = surveyService;
        this.quoteService = quoteService;
        this.projectService = projectService;
        this.paymentService = paymentService;
        this.serviceRequestService = serviceRequestService;
    }

    public Page<CustomerResponse> getCustomers(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return customerRepository.searchCustomers(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    public List<CustomerResponse> getAllCustomersList() {
        return customerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return mapToResponse(c);
    }

    public CustomerDetailResponse getCustomer360Detail(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        List<LeadDTO.LeadResponse> leads = leadRepository.findByCustomerId(id).stream()
                .map(leadService::mapToResponse).collect(Collectors.toList());

        List<SiteSurveyDTO.SiteSurveyResponse> surveys = surveyRepository.findByCustomerId(id).stream()
                .map(surveyService::mapToResponse).collect(Collectors.toList());

        List<QuoteDTO.QuoteResponse> quotes = quoteRepository.findByCustomerId(id).stream()
                .map(quoteService::mapToResponse).collect(Collectors.toList());

        List<ProjectDTO.ProjectResponse> projects = projectRepository.findByCustomerId(id).stream()
                .map(projectService::mapToResponse).collect(Collectors.toList());

        List<PaymentDTO.PaymentResponse> payments = paymentRepository.findByCustomerId(id).stream()
                .map(paymentService::mapToResponse).collect(Collectors.toList());

        List<ServiceRequestDTO.ServiceResponse> services = serviceRepository.findByCustomerId(id).stream()
                .map(serviceRequestService::mapToResponse).collect(Collectors.toList());

        return new CustomerDetailResponse(mapToResponse(c), leads, surveys, quotes, projects, payments, services);
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest req, User currentUser) {
        Customer c = new Customer();
        c.setCustomerCode("CUST-" + (int)(Math.random() * 900 + 100));
        c.setName(req.name());
        c.setCompany(req.company());
        c.setEmail(req.email());
        c.setPhone(req.phone());
        c.setAddress(req.address());
        c.setCity(req.city());
        c.setStatus(req.status() != null ? req.status() : "ACTIVE");
        c.setNotes(req.notes());
        c.setTotalValue(BigDecimal.ZERO);

        Customer saved = customerRepository.save(c);

        activityService.logActivity(
                currentUser,
                "CUSTOMER_CREATED",
                "CUSTOMER",
                saved.getId(),
                "New client account created",
                saved.getName() + " (" + (saved.getCompany() != null ? saved.getCompany() : "Individual") + ") added to client database",
                "user-check",
                "success"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest req, User currentUser) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        c.setName(req.name());
        c.setCompany(req.company());
        c.setEmail(req.email());
        c.setPhone(req.phone());
        c.setAddress(req.address());
        c.setCity(req.city());
        if (req.status() != null) c.setStatus(req.status());
        c.setNotes(req.notes());

        Customer saved = customerRepository.save(c);

        activityService.logActivity(
                currentUser,
                "CUSTOMER_UPDATED",
                "CUSTOMER",
                saved.getId(),
                "Customer profile updated",
                "Updated details for " + saved.getName(),
                "edit-3",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteCustomer(Long id, User currentUser) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "CUSTOMER_DELETED",
                "CUSTOMER",
                c.getId(),
                "Customer removed",
                "Archived record for " + c.getName(),
                "trash-2",
                "danger"
        );

        customerRepository.delete(c);
    }

    @Transactional
    public com.verdant.crm.dto.BatchDataDTO.BatchImportResult batchImportCustomers(List<CustomerRequest> requests, User currentUser) {
        int success = 0;
        int failure = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            CustomerRequest req = requests.get(i);
            try {
                if (req.name() == null || req.name().trim().isEmpty()) {
                    failure++;
                    errors.add("Row " + (i + 1) + ": Name is required");
                    continue;
                }
                if (req.email() == null || req.email().trim().isEmpty()) {
                    failure++;
                    errors.add("Row " + (i + 1) + ": Email is required");
                    continue;
                }
                createCustomer(req, currentUser);
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
                customerRepository.findById(id).ifPresent(c -> {
                    activityService.logActivity(currentUser, "CUSTOMER_DELETED", "CUSTOMER", c.getId(), "Customer deleted (bulk)", "Removed " + c.getName(), "trash-2", "danger");
                    customerRepository.delete(c);
                });
            }
        } else if ("UPDATE_STATUS".equalsIgnoreCase(req.action()) && req.statusValue() != null) {
            for (Long id : req.ids()) {
                customerRepository.findById(id).ifPresent(c -> {
                    c.setStatus(req.statusValue());
                    customerRepository.save(c);
                });
            }
            activityService.logActivity(currentUser, "CUSTOMER_BULK_UPDATE", "CUSTOMER", null, "Bulk status updated", "Updated status to " + req.statusValue() + " for " + req.ids().size() + " customers", "check-circle", "info");
        }
    }

    public CustomerResponse mapToResponse(Customer c) {
        if (c == null) return null;
        return new CustomerResponse(
                c.getId(),
                c.getCustomerCode(),
                c.getName(),
                c.getCompany(),
                c.getEmail(),
                c.getPhone(),
                c.getAddress(),
                c.getCity(),
                c.getTotalValue(),
                c.getStatus(),
                c.getCustomerSince(),
                c.getNotes(),
                c.getCreatedAt()
        );
    }
}

