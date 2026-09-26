package com.quickflow.task.api;

import java.time.Instant;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.task.domain.TaskPriority;
import com.quickflow.task.domain.TaskStatus;

@Schema(description = "A task with its computed overdue flag")
public record TaskResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Write the report") String title,
        @Schema(example = "Quarterly numbers", nullable = true) String description,
        @Schema(example = "TODO") TaskStatus status,
        @Schema(example = "HIGH") TaskPriority priority,
        @Schema(example = "2026-09-30", nullable = true) LocalDate dueDate,
        @Schema(example = "2026-09-26T15:00:00Z") Instant createdAt,
        @Schema(example = "2026-09-26T15:00:00Z") Instant updatedAt,
        @Schema(description = "Set while status is DONE", example = "2026-09-26T16:00:00Z", nullable = true)
        Instant completedAt,
        @Schema(example = "false") boolean archived,
        @Schema(description = "dueDate is before today, status is not DONE, and the task is not archived",
                example = "false") boolean overdue) {
}
