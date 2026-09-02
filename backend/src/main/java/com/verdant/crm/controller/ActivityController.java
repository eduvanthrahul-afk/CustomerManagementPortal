package com.verdant.crm.controller;

import com.verdant.crm.dto.ActivityDTO.ActivityResponse;
import com.verdant.crm.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ActivityResponse>> getRecentActivities(@RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(activityService.getRecentActivities(limit));
    }
}
