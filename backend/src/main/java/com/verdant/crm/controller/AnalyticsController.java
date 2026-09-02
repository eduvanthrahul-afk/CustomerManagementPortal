package com.verdant.crm.controller;

import com.verdant.crm.dto.AnalyticsDTO.AnalyticsOverviewResponse;
import com.verdant.crm.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> getAnalyticsOverview(
            @RequestParam(defaultValue = "all") String timeframe) {
        return ResponseEntity.ok(analyticsService.getAnalyticsOverview(timeframe));
    }
}
