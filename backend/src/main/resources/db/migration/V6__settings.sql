-- M07 Settings (D-51): a single row, id = 1
CREATE TABLE app_settings (
    id                    BIGINT       PRIMARY KEY,
    display_name          VARCHAR(100) NOT NULL,
    notifications_enabled BOOLEAN      NOT NULL,
    browser_notifications BOOLEAN      NOT NULL,
    default_view          VARCHAR(20)  NOT NULL,
    CONSTRAINT ck_app_settings_single CHECK (id = 1),
    CONSTRAINT ck_app_settings_view CHECK (default_view IN ('DASHBOARD', 'TASKS', 'HABITS', 'LEARNING', 'PLANS', 'SETTINGS'))
);

INSERT INTO app_settings (id, display_name, notifications_enabled, browser_notifications, default_view)
VALUES (1, 'Friend', TRUE, FALSE, 'DASHBOARD');
