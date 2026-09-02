package com.verdant.crm.service;

import com.verdant.crm.dto.ProjectDTO.*;
import com.verdant.crm.entity.Customer;
import com.verdant.crm.entity.Project;
import com.verdant.crm.entity.Quote;
import com.verdant.crm.entity.User;
import com.verdant.crm.exception.ResourceNotFoundException;
import com.verdant.crm.repository.CustomerRepository;
import com.verdant.crm.repository.ProjectRepository;
import com.verdant.crm.repository.QuoteRepository;
import com.verdant.crm.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CustomerRepository customerRepository;
    private final QuoteRepository quoteRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public ProjectService(ProjectRepository projectRepository,
                          CustomerRepository customerRepository,
                          QuoteRepository quoteRepository,
                          UserRepository userRepository,
                          ActivityService activityService) {
        this.projectRepository = projectRepository;
        this.customerRepository = customerRepository;
        this.quoteRepository = quoteRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
    }

    public Page<ProjectResponse> getProjects(String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return projectRepository.searchProjects(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    public List<ProjectResponse> getAllProjectsList() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(p);
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest req, User currentUser) {
        Customer customer = customerRepository.findById(req.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.customerId()));

        Project p = new Project();
        p.setProjectNumber("PRJ-" + (int)(Math.random() * 900 + 100));
        p.setCustomer(customer);
        p.setProjectName(req.projectName());
        p.setLocation(req.location());
        p.setStartDate(req.startDate());
        p.setExpectedCompletion(req.expectedCompletion());
        p.setActualCompletion(req.actualCompletion());
        p.setStatus(req.status() != null ? req.status() : "PLANNED");
        p.setBudget(req.budget() != null ? req.budget() : BigDecimal.ZERO);
        p.setProgressPercentage(req.progressPercentage() != null ? req.progressPercentage() : 0);
        p.setNotes(req.notes());

        if (req.quoteId() != null) {
            quoteRepository.findById(req.quoteId()).ifPresent(p::setQuote);
        }

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(p::setAssignedUser);
        } else if (currentUser != null) {
            p.setAssignedUser(currentUser);
        }

        Project saved = projectRepository.save(p);

        activityService.logActivity(
                currentUser,
                "PROJECT_CREATED",
                "PROJECT",
                saved.getId(),
                "New project in-flight (" + saved.getProjectNumber() + ")",
                saved.getProjectName() + " created for " + saved.getCustomer().getName() + " (₹" + saved.getBudget() + ")",
                "briefcase",
                "success"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest req, User currentUser) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(p::setCustomer);
        }
        if (req.quoteId() != null) {
            quoteRepository.findById(req.quoteId()).ifPresent(p::setQuote);
        } else {
            p.setQuote(null);
        }

        p.setProjectName(req.projectName());
        p.setLocation(req.location());
        p.setStartDate(req.startDate());
        p.setExpectedCompletion(req.expectedCompletion());
        p.setActualCompletion(req.actualCompletion());
        if (req.status() != null) p.setStatus(req.status());
        if (req.budget() != null) p.setBudget(req.budget());
        if (req.progressPercentage() != null) p.setProgressPercentage(req.progressPercentage());
        p.setNotes(req.notes());

        if (req.assignedUserId() != null) {
            userRepository.findById(req.assignedUserId()).ifPresent(p::setAssignedUser);
        } else {
            p.setAssignedUser(null);
        }

        Project saved = projectRepository.save(p);

        activityService.logActivity(
                currentUser,
                "PROJECT_UPDATED",
                "PROJECT",
                saved.getId(),
                "Project updated (" + saved.getProjectNumber() + ")",
                saved.getProjectName() + " progress: " + saved.getProgressPercentage() + "% (Status: " + saved.getStatus() + ")",
                "activity",
                "info"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ProjectResponse updateStatus(Long id, String status, User currentUser) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        p.setStatus(status);
        if ("COMPLETED".equalsIgnoreCase(status) && p.getProgressPercentage() < 100) {
            p.setProgressPercentage(100);
        }
        Project saved = projectRepository.save(p);

        String badge = "COMPLETED".equals(status) ? "success" : ("DELAYED".equals(status) ? "warning" : "info");
        activityService.logActivity(
                currentUser,
                "PROJECT_STATUS_" + status,
                "PROJECT",
                saved.getId(),
                "Project " + saved.getProjectNumber() + " is now " + status,
                saved.getProjectName() + " marked as " + status,
                "clock",
                badge
        );

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        activityService.logActivity(
                currentUser,
                "PROJECT_DELETED",
                "PROJECT",
                p.getId(),
                "Project removed",
                "Deleted " + p.getProjectName(),
                "trash-2",
                "danger"
        );

        projectRepository.delete(p);
    }

    public ProjectResponse mapToResponse(Project p) {
        if (p == null) return null;
        return new ProjectResponse(
                p.getId(),
                p.getProjectNumber(),
                p.getCustomer() != null ? p.getCustomer().getId() : null,
                p.getCustomer() != null ? p.getCustomer().getName() : "Unknown",
                p.getQuote() != null ? p.getQuote().getId() : null,
                p.getQuote() != null ? p.getQuote().getQuoteNumber() : null,
                p.getProjectName(),
                p.getLocation(),
                p.getStartDate(),
                p.getExpectedCompletion(),
                p.getActualCompletion(),
                p.getAssignedUser() != null ? p.getAssignedUser().getId() : null,
                p.getAssignedUser() != null ? p.getAssignedUser().getFullName() : "Unassigned",
                p.getStatus(),
                p.getBudget(),
                p.getProgressPercentage(),
                p.getNotes(),
                p.getCreatedAt()
        );
    }
}
