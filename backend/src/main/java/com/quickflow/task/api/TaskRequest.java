package com.quickflow.task.api;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.task.domain.TaskPriority;
import com.quickflow.task.domain.TaskStatus;

@Schema(description = "Create or update a task")
public record TaskRequest(
        @Schema(example = "Write the report", maxLength = 200, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Schema(example = "Quarterly numbers", maxLength = 2000, nullable = true)
        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @Schema(description = "Create: defaults to TODO. Update: omitted keeps the current status", example = "TODO",
                nullable = true)
        TaskStatus status,

        @Schema(description = "Create: defaults to MEDIUM. Update: omitted keeps the current priority", example = "HIGH",
                nullable = true)
        TaskPriority priority,

        @Schema(description = "Optional due date. On update, omitted/null clears it", example = "2026-09-30",
                nullable = true)
        LocalDate dueDate) {
}
