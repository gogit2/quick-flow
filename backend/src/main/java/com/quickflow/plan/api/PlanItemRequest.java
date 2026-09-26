package com.quickflow.plan.api;

import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.plan.domain.PlanSourceType;

@Schema(description = "A plan item: an existing task, habit or learning card")
public record PlanItemRequest(
        @Schema(example = "TASK", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Source type is required")
        PlanSourceType sourceType,

        @Schema(description = "Id of the task, habit or learning card", example = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Source id is required")
        Long sourceId) {
}
