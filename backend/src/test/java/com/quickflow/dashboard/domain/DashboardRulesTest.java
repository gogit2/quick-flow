package com.quickflow.dashboard.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.quickflow.habit.domain.HabitFrequency;

class DashboardRulesTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");
    // Saturday 2026-09-26, 14:00 in Dubai
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-26T10:00:00Z"), ZONE);
    private static final Instant NOW = CLOCK.instant();
    private static final LocalDate TODAY = LocalDate.now(CLOCK);

    @Test
    void greetingFollowsLocalHourBoundaries() {
        assertThat(DashboardRules.greeting("Sam", LocalTime.now(CLOCK))).isEqualTo("Good afternoon, Sam");
        assertThat(DashboardRules.partOfDay(LocalTime.of(4, 59))).isEqualTo("evening");
        assertThat(DashboardRules.partOfDay(LocalTime.of(5, 0))).isEqualTo("morning");
        assertThat(DashboardRules.partOfDay(LocalTime.of(11, 59))).isEqualTo("morning");
        assertThat(DashboardRules.partOfDay(LocalTime.of(12, 0))).isEqualTo("afternoon");
        assertThat(DashboardRules.partOfDay(LocalTime.of(17, 59))).isEqualTo("afternoon");
        assertThat(DashboardRules.partOfDay(LocalTime.of(18, 0))).isEqualTo("evening");
        assertThat(DashboardRules.partOfDay(LocalTime.MIDNIGHT)).isEqualTo("evening");
    }

    @Test
    void completionPercentRoundsAndHandlesNoTasks() {
        assertThat(DashboardRules.completionPercent(0, 0)).isZero();
        assertThat(DashboardRules.completionPercent(1, 3)).isEqualTo(33);
        assertThat(DashboardRules.completionPercent(2, 3)).isEqualTo(67);
        assertThat(DashboardRules.completionPercent(1, 8)).isEqualTo(13); // 12.5 rounds half-up
        assertThat(DashboardRules.completionPercent(4, 4)).isEqualTo(100);
    }

    @Test
    void todaysHabitsAreActiveDailyAndUndoneWeekly() {
        List<LocalDate> none = List.of();
        List<LocalDate> doneToday = List.of(TODAY);
        List<LocalDate> doneMonday = List.of(LocalDate.of(2026, 9, 21));
        List<LocalDate> doneLastWeek = List.of(LocalDate.of(2026, 9, 20));

        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.DAILY, true, none, TODAY)).isTrue();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.DAILY, true, doneToday, TODAY)).isTrue();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.DAILY, false, none, TODAY)).isFalse();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.WEEKLY, true, none, TODAY)).isTrue();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.WEEKLY, true, doneMonday, TODAY)).isFalse();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.WEEKLY, true, doneLastWeek, TODAY)).isTrue();
        assertThat(DashboardRules.isTodaysHabit(HabitFrequency.WEEKLY, false, none, TODAY)).isFalse();
    }

    @Test
    void completedTodayUsesTheAppZone() {
        // 2026-09-25T21:00Z is already 2026-09-26 01:00 in Dubai
        assertThat(DashboardRules.isOnDay(Instant.parse("2026-09-25T21:00:00Z"), TODAY, ZONE)).isTrue();
        assertThat(DashboardRules.isOnDay(Instant.parse("2026-09-25T19:59:59Z"), TODAY, ZONE)).isFalse();
        assertThat(DashboardRules.isOnDay(null, TODAY, ZONE)).isFalse();
    }

    @Test
    void recentMilestonesAreTheLastSevenDays() {
        assertThat(DashboardRules.isRecentMilestone(NOW, NOW)).isTrue();
        assertThat(DashboardRules.isRecentMilestone(NOW.minusSeconds(7 * 86400), NOW)).isTrue();
        assertThat(DashboardRules.isRecentMilestone(NOW.minusSeconds(7 * 86400 + 1), NOW)).isFalse();
        assertThat(DashboardRules.isRecentMilestone(null, NOW)).isFalse();
    }
}
