package com.quickflow.common.time;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

import org.springframework.stereotype.Component;

/** Clock-backed helpers for "now", "today" and ISO week boundaries in the app zone. */
@Component
public class AppTime {

    private final Clock clock;

    public AppTime(Clock clock) {
        this.clock = clock;
    }

    public Clock clock() {
        return clock;
    }

    public ZoneId zone() {
        return clock.getZone();
    }

    public Instant now() {
        return clock.instant();
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Monday of the ISO week containing {@code date}. */
    public static LocalDate weekStart(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
