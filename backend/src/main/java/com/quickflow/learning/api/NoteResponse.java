package com.quickflow.learning.api;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A note on a learning card")
public record NoteResponse(
        @Schema(example = "5") Long id,
        @Schema(example = "1") Long cardId,
        @Schema(example = "Chapter 3 explains auto-configuration well") String text,
        @Schema(example = "2026-09-26T15:00:00Z") Instant createdAt) {
}
