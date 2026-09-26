package com.quickflow.common.time;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

class AppTimeTest {

    @Test
    void todayUsesClockZone() {
        // 2026-09-26T22:30Z is already 2026-09-27 in Asia/Dubai (+04:00)
        Clock clock = Clock.fixed(Instant.parse("2026-09-26T22:30:00Z"), ZoneId.of("Asia/Dubai"));
        AppTime time = new AppTime(clock);

        assertThat(time.now()).isEqualTo(Instant.parse("2026-09-26T22:30:00Z"));
        assertThat(time.today()).isEqualTo(LocalDate.of(2026, 9, 27));
        assertThat(time.zone()).isEqualTo(ZoneId.of("Asia/Dubai"));
    }

    @Test
    void weekStartIsIsoMonday() {
        assertThat(AppTime.weekStart(LocalDate.of(2026, 9, 27))).isEqualTo(LocalDate.of(2026, 9, 21)); // Sunday
        assertThat(AppTime.weekStart(LocalDate.of(2026, 9, 21))).isEqualTo(LocalDate.of(2026, 9, 21)); // Monday
    }

    @Test
    void resolveZoneDefaultsToSystem() {
        assertThat(TimeConfig.resolveZone("")).isEqualTo(ZoneId.systemDefault());
        assertThat(TimeConfig.resolveZone(null)).isEqualTo(ZoneId.systemDefault());
        assertThat(TimeConfig.resolveZone("UTC")).isEqualTo(ZoneId.of("UTC"));
    }
}
