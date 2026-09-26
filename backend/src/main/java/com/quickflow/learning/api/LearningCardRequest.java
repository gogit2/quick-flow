package com.quickflow.learning.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.learning.domain.LearningStatus;

@Schema(description = "Create or update a learning card")
public record LearningCardRequest(
        @Schema(example = "Spring Boot in Action", maxLength = 200, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Schema(description = "Description or source (link, book, course name)",
                example = "https://example.com/course", maxLength = 2000, nullable = true)
        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @Schema(description = "Manual status override (update only; ignored on create). Omit to keep the current status. "
                + "A later milestone change re-derives it.", example = "IN_PROGRESS", nullable = true)
        LearningStatus status) {
}
