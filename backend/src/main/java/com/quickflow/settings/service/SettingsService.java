package com.quickflow.settings.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.settings.domain.DefaultView;
import com.quickflow.settings.domain.Settings;
import com.quickflow.settings.repo.SettingsRepository;

@Service
@Transactional
public class SettingsService {

    private final SettingsRepository settings;

    public SettingsService(SettingsRepository settings) {
        this.settings = settings;
    }

    /** The single row (seeded by V6); recreated with the defaults if it is missing. */
    public Settings get() {
        return settings.findById(Settings.SINGLETON_ID).orElseGet(() -> settings.save(Settings.defaults()));
    }

    /** Replaces displayName; a null flag or view keeps the current value (A-10). */
    public Settings update(String displayName, Boolean notificationsEnabled, Boolean browserNotifications,
            DefaultView defaultView) {
        Settings s = get();
        s.setDisplayName(displayName.trim());
        if (notificationsEnabled != null) {
            s.setNotificationsEnabled(notificationsEnabled);
        }
        if (browserNotifications != null) {
            s.setBrowserNotifications(browserNotifications);
        }
        if (defaultView != null) {
            s.setDefaultView(defaultView);
        }
        return settings.saveAndFlush(s);
    }
}
