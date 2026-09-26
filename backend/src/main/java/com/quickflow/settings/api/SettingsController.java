package com.quickflow.settings.api;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.quickflow.settings.domain.Settings;
import com.quickflow.settings.service.SettingsService;

@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "Single-user application preferences (D-51)")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Get the settings",
            description = "Defaults: displayName Friend, notificationsEnabled true, browserNotifications false, "
                    + "defaultView DASHBOARD.")
    public SettingsResponse get() {
        return toResponse(service.get());
    }

    @PutMapping
    @Operation(summary = "Update the settings",
            description = "displayName is required (max 100). Omitted flags or defaultView keep their value (A-10).")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    public SettingsResponse update(@Valid @RequestBody SettingsRequest req) {
        return toResponse(service.update(req.displayName(), req.notificationsEnabled(), req.browserNotifications(),
                req.defaultView()));
    }

    private static SettingsResponse toResponse(Settings s) {
        return new SettingsResponse(s.getDisplayName(), s.isNotificationsEnabled(), s.isBrowserNotifications(),
                s.getDefaultView());
    }
}
