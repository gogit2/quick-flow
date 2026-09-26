package com.quickflow.plan.api;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.plan.domain.PlanSourceType;

@Schema(description = "A plan item with its source's current title and status (D-48)")
public record PlanItemResponse(
        @Schema(example = "10") Long id,
        @Schema(example = "TASK") PlanSourceType sourceType,
        @Schema(example = "1") Long sourceId,
        @Schema(description = "Task title, habit name or learning card title", example = "Write report",
                nullable = true) String sourceTitle,
        @Schema(description = "TASK: TODO|IN_PROGRESS|DONE. LEARNING_RESOURCE: NOT_STARTED|IN_PROGRESS|COMPLETED. "
                + "HABIT: DONE|PENDING|INACTIVE for the current period (A-08)", example = "TODO", nullable = true)
        String sourceStatus,
        @Schema(example = "false") boolean done,
        @Schema(description = "0-based display order", example = "0") int position) {
}
