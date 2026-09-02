package com.verdant.crm.controller;

import com.verdant.crm.dto.GlobalSearchDTO.GlobalSearchResult;
import com.verdant.crm.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<GlobalSearchResult> search(@RequestParam(name = "q", defaultValue = "") String query) {
        return ResponseEntity.ok(searchService.search(query));
    }
}
