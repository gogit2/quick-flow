package com.quickflow.plan.api;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.plan.domain.PlanStatus;

@Schema(description = "A plan with its items and values computed at serverTime (D-43, D-44)")
public record PlanResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Morning focus block") String title,
        @Schema(description = "Minutes", example = "60") int estimatedDuration,
        @Schema(example = "2026-09-26T08:00:00Z") Instant startDateTime,
        @Schema(example = "2026-09-26T09:00:00Z") Instant endDateTime,
        @Schema(description = "1 = highest", example = "1") int priorityOrder,
        @Schema(description = "Derived: COMPLETED if all items done or now ≥ end; IN_PROGRESS if start ≤ now < end; "
                + "else NOT_STARTED", example = "IN_PROGRESS") PlanStatus status,
        @Schema(example = "2026-09-26T07:30:00Z") Instant createdAt,
        @Schema(description = "In display order") List<PlanItemResponse> items,
        @Schema(example = "1") int doneItems,
        @Schema(example = "3") int totalItems,
        @Schema(description = "doneItems ÷ totalItems, 0–100; 0 when there are no items", example = "33")
        int progressPercent,
        @Schema(description = "Seconds until endDateTime while IN_PROGRESS, else null (BR-12)", example = "1800",
                nullable = true) Long remainingSeconds,
        @Schema(description = "Seconds until startDateTime while NOT_STARTED, else null (A-01)", example = "600",
                nullable = true) Long startsInSeconds,
        @Schema(description = "Server clock when computed; use it to correct client clock skew",
                example = "2026-09-26T08:30:00Z") Instant serverTime) {
}
