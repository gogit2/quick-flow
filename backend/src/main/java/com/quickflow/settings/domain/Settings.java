package com.quickflow.settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The single application settings row (D-51). */
@Entity
@Table(name = "app_settings")
public class Settings {

    public static final long SINGLETON_ID = 1L;
    public static final String DEFAULT_DISPLAY_NAME = "Friend";

    @Id
    private Long id;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationsEnabled;

    @Column(name = "browser_notifications", nullable = false)
    private boolean browserNotifications;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_view", nullable = false, length = 20)
    private DefaultView defaultView;

    protected Settings() {
    }

    /** The D-51 defaults. */
    public static Settings defaults() {
        Settings s = new Settings();
        s.id = SINGLETON_ID;
        s.displayName = DEFAULT_DISPLAY_NAME;
        s.notificationsEnabled = true;
        s.browserNotifications = false;
        s.defaultView = DefaultView.DASHBOARD;
        return s;
    }

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public boolean isBrowserNotifications() {
        return browserNotifications;
    }

    public void setBrowserNotifications(boolean browserNotifications) {
        this.browserNotifications = browserNotifications;
    }

    public DefaultView getDefaultView() {
        return defaultView;
    }

    public void setDefaultView(DefaultView defaultView) {
        this.defaultView = defaultView;
    }
}
