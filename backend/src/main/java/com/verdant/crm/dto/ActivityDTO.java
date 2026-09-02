package com.verdant.crm.dto;

import java.time.OffsetDateTime;

public class ActivityDTO {
    public record ActivityResponse(
            Long id,
            Long userId,
            String userName,
            String actionType,
            String entityType,
            Long entityId,
            String title,
            String description,
            String icon,
            String badgeType,
            OffsetDateTime createdAt
    ) {}
}
