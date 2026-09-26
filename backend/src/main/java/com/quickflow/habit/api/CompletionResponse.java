package com.quickflow.habit.api;

import java.time.Instant;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "One habit completion")
public record CompletionResponse(
        @Schema(example = "10") Long id,
        @Schema(example = "1") Long habitId,
        @Schema(example = "2026-09-26") LocalDate date,
        @Schema(example = "2026-09-26T15:00:00Z") Instant createdAt) {
}
