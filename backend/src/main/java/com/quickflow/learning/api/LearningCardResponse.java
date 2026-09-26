package com.quickflow.learning.api;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.learning.domain.LearningStatus;

@Schema(description = "A learning card with its milestones, notes and computed progress")
public record LearningCardResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Spring Boot in Action") String title,
        @Schema(example = "https://example.com/course", nullable = true) String description,
        @Schema(description = "Derived from milestones (D-31) unless set manually since the last milestone change",
                example = "IN_PROGRESS") LearningStatus status,
        @Schema(example = "2026-09-26T15:00:00Z") Instant createdAt,
        @Schema(description = "In display order") List<MilestoneResponse> milestones,
        @Schema(description = "Newest first") List<NoteResponse> notes,
        @Schema(example = "2") int milestonesTotal,
        @Schema(example = "1") int milestonesDone,
        @Schema(description = "milestonesDone ÷ milestonesTotal, 0–100; 0 when there are no milestones", example = "50")
        int progressPercent) {
}
