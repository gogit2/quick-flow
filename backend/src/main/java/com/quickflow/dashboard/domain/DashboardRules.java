package com.quickflow.dashboard.domain;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;

import com.quickflow.habit.domain.HabitFrequency;
import com.quickflow.habit.domain.HabitRules;

/** Pure dashboard rules (no Spring): greeting (D-52, A-02), completion % (D-15), today's habits (D-24). */
public final class DashboardRules {

    static final Duration RECENT_MILESTONE_WINDOW = Duration.ofDays(7);

    private DashboardRules() {
    }

    /** A-02: morning 05:00–11:59, afternoon 12:00–17:59, evening otherwise. */
    public static String partOfDay(LocalTime localTime) {
        int hour = localTime.getHour();
        if (hour >= 5 && hour < 12) {
            return "morning";
        }
        if (hour >= 12 && hour < 18) {
            return "afternoon";
        }
        return "evening";
    }

    /** D-52: "Good morning/afternoon/evening, {displayName}". */
    public static String greeting(String displayName, LocalTime localTime) {
        return "Good " + partOfDay(localTime) + ", " + displayName;
    }

    /** D-15: DONE ÷ non-archived tasks, rounded half-up; 0 when there are no tasks. */
    public static int completionPercent(int doneCount, int totalActive) {
        if (totalActive <= 0) {
            return 0;
        }
        return (int) Math.round(doneCount * 100.0 / totalActive);
    }

    /** D-24: active daily habits, plus active weekly habits not yet done this ISO week. */
    public static boolean isTodaysHabit(HabitFrequency frequency, boolean active, Collection<LocalDate> dates,
            LocalDate today) {
        if (!active) {
            return false;
        }
        return frequency == HabitFrequency.DAILY || !HabitRules.isDoneForPeriod(frequency, dates, today);
    }

    /** True when {@code completedAt} falls on {@code today} in {@code zone}. */
    public static boolean isOnDay(Instant completedAt, LocalDate today, ZoneId zone) {
        return completedAt != null && completedAt.atZone(zone).toLocalDate().equals(today);
    }

    /** D-30: completed within the last 7 days (now − 7 days ≤ completedAt ≤ now). */
    public static boolean isRecentMilestone(Instant completedAt, Instant now) {
        return completedAt != null && !completedAt.isBefore(now.minus(RECENT_MILESTONE_WINDOW))
                && !completedAt.isAfter(now);
    }
}
