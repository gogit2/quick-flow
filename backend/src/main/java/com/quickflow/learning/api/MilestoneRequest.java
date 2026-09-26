package com.quickflow.learning.api;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Add or update a milestone of a learning card")
public record MilestoneRequest(
        @Schema(example = "Finish chapter 1", maxLength = 200, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Schema(description = "Optional target date; null clears it on update", example = "2026-10-15", nullable = true)
        LocalDate targetDate,

        @Schema(description = "Update only: mark done/not done. Omit to keep. Ignored on create.", example = "true",
                nullable = true)
        Boolean done) {
}
