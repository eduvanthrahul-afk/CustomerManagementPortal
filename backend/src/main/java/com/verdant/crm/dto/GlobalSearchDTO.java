package com.verdant.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public class GlobalSearchDTO {

    public record SearchItem(
            String type, // LEAD, CUSTOMER, QUOTE, PROJECT, PAYMENT
            Long id,
            String code,
            String title,
            String subtitle,
            BigDecimal value,
            String status,
            String badgeType
    ) {}

    public record GlobalSearchResult(
            String query,
            int totalResults,
            List<SearchItem> leads,
            List<SearchItem> customers,
            List<SearchItem> quotes,
            List<SearchItem> projects,
            List<SearchItem> payments
    ) {}
}
