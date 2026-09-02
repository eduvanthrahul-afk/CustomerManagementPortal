package com.verdant.crm.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "activities")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType; // LEAD_CREATED, QUOTE_VIEWED, PAYMENT_RECEIVED, SURVEY_COMPLETED, PROJECT_DELAYED, CUSTOMER_ONBOARDED, STATUS_CHANGED

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // LEAD, QUOTE, PAYMENT, SURVEY, PROJECT, CUSTOMER, SERVICE

    @Column(name = "entity_id")
    private Long entityId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String icon = "activity";

    @Column(name = "badge_type", length = 50)
    private String badgeType = "neutral"; // success, warning, danger, info, neutral

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Activity() {}

    public Activity(User user, String actionType, String entityType, Long entityId, String title, String description, String icon, String badgeType) {
        this.user = user;
        this.actionType = actionType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.badgeType = badgeType;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getBadgeType() { return badgeType; }
    public void setBadgeType(String badgeType) { this.badgeType = badgeType; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
