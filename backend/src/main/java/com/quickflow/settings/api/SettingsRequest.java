package com.quickflow.settings.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.settings.domain.DefaultView;

@Schema(description = "Update the settings. Omitted flags or defaultView keep their current value (A-10)")
public record SettingsRequest(
        @Schema(example = "Ahmed", maxLength = 100, requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Display name is required")
        @Size(max = 100, message = "Display name must be at most 100 characters")
        String displayName,

        @Schema(example = "true", nullable = true) Boolean notificationsEnabled,

        @Schema(example = "false", nullable = true) Boolean browserNotifications,

        @Schema(example = "DASHBOARD", nullable = true) DefaultView defaultView) {
}
