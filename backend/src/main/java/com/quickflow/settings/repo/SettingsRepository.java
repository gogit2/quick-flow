package com.quickflow.settings.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.settings.domain.Settings;

public interface SettingsRepository extends JpaRepository<Settings, Long> {
}
