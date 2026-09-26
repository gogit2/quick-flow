package com.quickflow.habit.api;

import java.time.LocalDate;
import java.util.List;

import com.quickflow.habit.domain.Habit;
import com.quickflow.habit.domain.HabitCompletion;
import com.quickflow.habit.domain.HabitRules;
import com.quickflow.habit.service.HabitService.HabitView;

public final class HabitMapper {

    private HabitMapper() {
    }

    public static HabitResponse toResponse(HabitView view, LocalDate today) {
        Habit h = view.habit();
        List<LocalDate> dates = view.completionDates();
        return new HabitResponse(
                h.getId(), h.getName(), h.getDescription(), h.getFrequency(), h.isActive(), h.getCreatedAt(),
                dates.contains(today),
                HabitRules.isDoneForPeriod(h.getFrequency(), dates, today),
                HabitRules.currentStreak(h.getFrequency(), dates, today),
                HabitRules.progressPercent(h.getFrequency(), dates, today),
                dates.isEmpty() ? null : dates.get(0));
    }

    static CompletionResponse toResponse(HabitCompletion c) {
        return new CompletionResponse(c.getId(), c.getHabitId(), c.getCompletionDate(), c.getCreatedAt());
    }
}
