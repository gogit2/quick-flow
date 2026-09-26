package com.quickflow.learning.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Add a note to a learning card")
public record NoteRequest(
        @Schema(example = "Chapter 3 explains auto-configuration well", maxLength = 5000,
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Text is required") @Size(max = 5000, message = "Text must be at most 5000 characters")
        String text) {
}
