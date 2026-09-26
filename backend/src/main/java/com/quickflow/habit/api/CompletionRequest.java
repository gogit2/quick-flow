package com.quickflow.habit.api;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Optional completion body. Omit it (or `date`) to complete for today.")
public record CompletionRequest(
        @Schema(example = "2026-09-25", nullable = true, description = "Completion date in the app zone; not in the future")
        LocalDate date) {
}
