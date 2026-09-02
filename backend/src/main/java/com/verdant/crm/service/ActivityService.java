package com.verdant.crm.service;

import com.verdant.crm.dto.ActivityDTO.ActivityResponse;
import com.verdant.crm.entity.Activity;
import com.verdant.crm.entity.User;
import com.verdant.crm.repository.ActivityRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @Transactional
    public Activity logActivity(User user, String actionType, String entityType, Long entityId,
                                String title, String description, String icon, String badgeType) {
        Activity activity = new Activity(user, actionType, entityType, entityId, title, description, icon, badgeType);
        return activityRepository.save(activity);
    }

    public List<ActivityResponse> getRecentActivities(int limit) {
        return activityRepository.findRecentActivities(PageRequest.of(0, limit))
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ActivityResponse mapToDTO(Activity a) {
        return new ActivityResponse(
                a.getId(),
                a.getUser() != null ? a.getUser().getId() : null,
                a.getUser() != null ? a.getUser().getFullName() : "System",
                a.getActionType(),
                a.getEntityType(),
                a.getEntityId(),
                a.getTitle(),
                a.getDescription(),
                a.getIcon(),
                a.getBadgeType(),
                a.getCreatedAt()
        );
    }
}
