package com.quickflow.plan.api;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Create or update (full replace) a plan. On update, items whose source is kept keep their done flag.")
public record PlanRequest(
        @Schema(example = "Morning focus block", maxLength = 200, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Schema(description = "Estimated duration in minutes (D-40); informational", example = "60", minimum = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Estimated duration is required")
        @Positive(message = "Estimated duration must be a positive number of minutes")
        Integer estimatedDuration,

        @Schema(example = "2026-09-26T08:00:00Z", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Start date/time is required")
        Instant startDateTime,

        @Schema(description = "Must be after startDateTime (BR-11)", example = "2026-09-26T09:00:00Z",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "End date/time is required")
        Instant endDateTime,

        @Schema(description = "1 = highest priority (D-41); need not be unique", example = "1", minimum = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Priority order is required")
        @Min(value = 1, message = "Priority order must be at least 1")
        Integer priorityOrder,

        @ArraySchema(arraySchema = @Schema(description = "At least one item (BR-10); each source at most once (D-42), "
                + "in display order", requiredMode = Schema.RequiredMode.REQUIRED))
        @NotEmpty(message = "A plan must have at least one item")
        List<@Valid @NotNull(message = "Item must not be null") PlanItemRequest> items) {
}
