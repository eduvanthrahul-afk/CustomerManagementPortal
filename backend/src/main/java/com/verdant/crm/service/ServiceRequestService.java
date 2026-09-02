package com.verdant.crm.service;

import com.verdant.crm.dto.ServiceRequestDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Project;
import com.verdant.crm.entity.ServiceRequest;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.ProjectRepository;
import com.verdant.crm.repository.ServiceRequestRepository;
import com.verdant.crm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRepository;
    private final CustomerRepository customerRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public ServiceRequestService(ServiceRequestRepository serviceRepository,
                                 CustomerRepository customerRepository,
                                 ProjectRepository projectRepository,
                                 UserRepository userRepository,
                                 ActivityService activityService) {
        this.serviceRepository = serviceRepository;
        this.customerRepository = customerRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    public Page<ServiceResponse> getServiceRequests(String search, String status, String priority, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;
        String cleanPriority = (priority != null && !priority.trim().isEmpty() && !priority.equalsIgnoreCase("ALL")) ? priority.trim() : null;

        return serviceRepository.searchServiceRequests(cleanSearch, cleanStatus, cleanPriority, pageable)
                .map(this::mapToResponse);
    }

    public ServiceResponse getServiceRequestById(Long id) {
        ServiceRequest s = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + id));
        return mapToResponse(s);
    }

    @Transactional
    public ServiceResponse createServiceRequest(ServiceRequestInput req, User currentUser) {
        Customer customer = customerRepository.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.customerId()));

        ServiceRequest s = new ServiceRequest();
        s.setTicketCode("SRV-" + (int)(Math.random() * 900 + 100));
        s.setCustomer(customer);
        s.setIssue(req.issue());
        s.setDescription(req.description());
        s.setPriority(req.priority() != null ? req.priority() : "MEDIUM");
        s.setStatus(req.status() != null ? req.status() : "OPEN");
        s.setDueDate(req.dueDate());
        s.setResolution(req.resolution());
        s.setNotes(req.notes());

        if (req.projectId() != null) {
            projectRepository.findById(req.projectId()).ifPresent(s::setProject);
        }

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(s::setAssignedUser);
        } else if (currentUser != null) {
            s.setAssignedUser(currentUser);
        }

        ServiceRequest saved = serviceRepository.save(s);

        activityService.logActivity(
                currentUser,
                "SERVICE_TICKET_CREATED",
                "SERVICE",
                saved.getId(),
                "Support ticket opened (" + saved.getTicketCode() + ")",
                saved.getIssue() + " for " + saved.getCustomer().getName() + " (Priority: " + saved.getPriority() + ")",
                "tool",
                "warning"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ServiceResponse updateServiceRequest(Long id, ServiceRequestInput req, User currentUser) {
        ServiceRequest s = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + id));

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(s::setCustomer);
        }
        if (req.projectId() != null) {
            projectRepository.findById(req.projectId()).ifPresent(s::setProject);
        } else {
            s.setProject(null);
        }

        s.setIssue(req.issue());
        s.setDescription(req.description());
        if (req.priority() != null) s.setPriority(req.priority());
        if (req.status() != null) s.setStatus(req.status());
        s.setDueDate(req.dueDate());
        s.setResolution(req.resolution());
        s.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(s::setAssignedUser);
        } else {
            s.setAssignedUser(null);
        }

        ServiceRequest saved = serviceRepository.save(s);

        activityService.logActivity(
                currentUser,
                "SERVICE_TICKET_UPDATED",
                "SERVICE",
                saved.getId(),
                "Service ticket " + saved.getTicketCode() + " updated",
                saved.getIssue() + " (Status: " + saved.getStatus() + ")",
                "edit",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteServiceRequest(Long id, User currentUser) {
        ServiceRequest s = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "SERVICE_TICKET_DELETED",
                "SERVICE",
                s.getId(),
                "Service ticket deleted",
                "Removed " + s.getTicketCode(),
                "trash-2",
                "danger"
        );

        serviceRepository.delete(s);
    }

    public ServiceResponse mapToResponse(ServiceRequest s) {
        if (s == null) return null;
        return new ServiceResponse(
                s.getId(),
                s.getTicketCode(),
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getName() : "Unknown",
                s.getProject() != null ? s.getProject().getId() : null,
                s.getProject() != null ? s.getProject().getProjectName() : null,
                s.getIssue(),
                s.getDescription(),
                s.getPriority(),
                s.getStatus(),
                s.getAssignedUser() != null ? s.getAssignedUser().getId() : null,
                s.getAssignedUser() != null ? s.getAssignedUser().getFullName() : "Unassigned",
                s.getDueDate(),
                s.getResolution(),
                s.getNotes(),
                s.getCreatedAt()
        );
    }
}
