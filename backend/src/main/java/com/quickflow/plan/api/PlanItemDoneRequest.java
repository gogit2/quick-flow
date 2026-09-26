package com.quickflow.plan.api;

import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Mark a plan item done or not done")
public record PlanItemDoneRequest(
        @Schema(description = "true = done (applies the BR-13 side effect), false = not done (source is not reverted)",
                example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "done is required")
        Boolean done) {
}
