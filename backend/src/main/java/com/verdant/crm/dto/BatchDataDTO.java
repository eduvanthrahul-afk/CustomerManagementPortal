package com.verdant.crm.dto;

import java.util.List;
import java.util.Map;

public class BatchDataDTO {

    public record BulkActionRequest(
            List<Long> ids,
            String action, // "UPDATE_STATUS", "DELETE"
            String statusValue
    ) {}

    public record BatchImportResult(
            int totalProcessed,
            int successCount,
            int failureCount,
            List<String> errors
    ) {}
}
