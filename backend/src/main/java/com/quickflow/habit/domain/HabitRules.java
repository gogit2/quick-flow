package com.quickflow.habit.domain;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Set;
import java.util.TreeSet;

import com.quickflow.common.error.BusinessRuleException;
import com.quickflow.common.time.AppTime;

/**
 * Pure habit rules (no Spring). {@code today} is always derived from the injected Clock by the caller.
 * Weekly periods are ISO weeks, Monday to Sunday (D-04).
 */
public final class HabitRules {

    static final int DAILY_WINDOW_DAYS = 7;
    static final int WEEKLY_WINDOW_WEEKS = 4;

    private HabitRules() {
    }

    /** D-21: daily = completed today; weekly = at least one completion in the current ISO week. */
    public static boolean isDoneForPeriod(HabitFrequency frequency, Collection<LocalDate> dates, LocalDate today) {
        if (frequency == HabitFrequency.DAILY) {
            return dates.contains(today);
        }
        LocalDate weekStart = AppTime.weekStart(today);
        return dates.stream().anyMatch(d -> !d.isBefore(weekStart) && !d.isAfter(weekStart.plusDays(6)));
    }

    /**
     * D-22: consecutive days (daily) or ISO weeks (weekly) with a completion, ending in the current period,
     * or in the previous period when the current one is not done yet.
     */
    public static int currentStreak(HabitFrequency frequency, Collection<LocalDate> dates, LocalDate today) {
        Set<LocalDate> periods = new TreeSet<>();
        for (LocalDate d : dates) {
            periods.add(periodStart(frequency, d));
        }
        LocalDate cursor = periodStart(frequency, today);
        if (!periods.contains(cursor)) {
            cursor = previousPeriod(frequency, cursor);
        }
        int streak = 0;
        while (periods.contains(cursor)) {
            streak++;
            cursor = previousPeriod(frequency, cursor);
        }
        return streak;
    }

    /**
     * D-23: daily = days completed in the last 7 days (today included) ÷ 7; weekly = ISO weeks completed in the
     * last 4 weeks (current week included) ÷ 4. Rounded half-up, capped at 100.
     */
    public static int progressPercent(HabitFrequency frequency, Collection<LocalDate> dates, LocalDate today) {
        LocalDate current = periodStart(frequency, today);
        int window = frequency == HabitFrequency.DAILY ? DAILY_WINDOW_DAYS : WEEKLY_WINDOW_WEEKS;
        LocalDate oldest = frequency == HabitFrequency.DAILY
                ? current.minusDays(window - 1L)
                : current.minusWeeks(window - 1L);
        Set<LocalDate> hit = new TreeSet<>();
        for (LocalDate d : dates) {
            LocalDate p = periodStart(frequency, d);
            if (!p.isBefore(oldest) && !p.isAfter(current)) {
                hit.add(p);
            }
        }
        int percent = (int) Math.round(hit.size() * 100.0 / window);
        return Math.min(percent, 100);
    }

    /** D-20: a completion date may not be in the future. */
    public static void validateCompletionDate(LocalDate date, LocalDate today) {
        if (date.isAfter(today)) {
            throw new BusinessRuleException("date", "Completion date cannot be in the future");
        }
    }

    private static LocalDate periodStart(HabitFrequency frequency, LocalDate date) {
        return frequency == HabitFrequency.DAILY ? date : AppTime.weekStart(date);
    }

    private static LocalDate previousPeriod(HabitFrequency frequency, LocalDate periodStart) {
        return frequency == HabitFrequency.DAILY ? periodStart.minusDays(1) : periodStart.minusWeeks(1);
    }
}
