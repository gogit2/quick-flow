package com.quickflow.settings.api;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.settings.domain.DefaultView;

@Schema(description = "Application settings (D-51)")
public record SettingsResponse(
        @Schema(description = "Used in the dashboard greeting", example = "Friend") String displayName,
        @Schema(example = "true") boolean notificationsEnabled,
        @Schema(example = "false") boolean browserNotifications,
        @Schema(description = "Page opened at app start", example = "DASHBOARD") DefaultView defaultView) {
}
