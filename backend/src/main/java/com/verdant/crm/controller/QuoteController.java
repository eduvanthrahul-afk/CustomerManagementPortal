package com.verdant.crm.controller;

import com.verdant.crm.dto.QuoteDTO.*;
import com.verdant.crm.entity.User;
import com.verdant.crm.service.AuthService;
import com.verdant.crm.service.QuoteService;
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
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteService quoteService;
    private final AuthService authService;

    public QuoteController(QuoteService quoteService, AuthService authService) {
        this.quoteService = quoteService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<QuoteResponse>> getQuotes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(quoteService.getQuotes(search, status, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<QuoteResponse>> getAllQuotesList() {
        return ResponseEntity.ok(quoteService.getAllQuotesList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponse> getQuoteById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteService.getQuoteById(id));
    }

    @PostMapping
    public ResponseEntity<QuoteResponse> createQuote(@Valid @RequestBody QuoteRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(quoteService.createQuote(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuoteResponse> updateQuote(@PathVariable Long id, @Valid @RequestBody QuoteRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        return ResponseEntity.ok(quoteService.updateQuote(id, request, currentUser));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<QuoteResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User currentUser = authService.getCurrentUserEntity();
        String status = body.get("status");
        return ResponseEntity.ok(quoteService.updateStatus(id, status, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteQuote(@PathVariable Long id) {
        User currentUser = authService.getCurrentUserEntity();
        quoteService.deleteQuote(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Quote deleted successfully"));
    }
}
