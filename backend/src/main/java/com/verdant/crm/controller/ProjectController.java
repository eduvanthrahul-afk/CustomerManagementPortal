package com.verdant.crm.controller;

import com.verdant.crm.dto.ProjectDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.ProjectService;
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
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final AuthService authService;

    public ProjectController(ProjectService projectService, AuthService authService) {
        this.projectService = projectService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> getProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(projectService.getProjects(search, status, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProjectResponse>> getAllProjectsList() {
        return ResponseEntity.ok(projectService.getAllProjectsList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(projectService.createProject(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(projectService.updateProject(id, request, currentUser));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProjectResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User currentUser = authService.getCurrentUserEntity();
        String status = body.get("status");
        return ResponseEntity.ok(projectService.updateStatus(id, status, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }
}
