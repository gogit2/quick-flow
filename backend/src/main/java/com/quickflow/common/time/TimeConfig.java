package com.quickflow.common.time;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Provides the single {@link Clock} used for all time logic (D-04). */
@Configuration
public class TimeConfig {

    @Bean
    public Clock clock(@Value("${app.zone:}") String zone) {
        return Clock.system(resolveZone(zone));
    }

    static ZoneId resolveZone(String zone) {
        return (zone == null || zone.isBlank()) ? ZoneId.systemDefault() : ZoneId.of(zone.trim());
    }
}
