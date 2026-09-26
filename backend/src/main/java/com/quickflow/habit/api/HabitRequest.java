package com.quickflow.habit.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.habit.domain.HabitFrequency;

@Schema(description = "Create or update a habit")
public record HabitRequest(
        @Schema(example = "Read 20 pages", maxLength = 150, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be at most 150 characters")
        String name,

        @Schema(example = "Before bed", maxLength = 1000, nullable = true)
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Schema(example = "DAILY", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Frequency is required")
        HabitFrequency frequency) {
}
