package com.quickflow.learning.api;

import java.time.Instant;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A milestone of a learning card")
public record MilestoneResponse(
        @Schema(example = "3") Long id,
        @Schema(example = "1") Long cardId,
        @Schema(example = "Finish chapter 1") String title,
        @Schema(example = "false") boolean done,
        @Schema(example = "2026-10-15", nullable = true) LocalDate targetDate,
        @Schema(description = "Set while done (D-30)", example = "2026-09-26T15:00:00Z", nullable = true)
        Instant completedAt,
        @Schema(description = "Display order within the card, 0-based", example = "0") int position) {
}
