package com.quickflow.habit.domain;

import static com.quickflow.habit.domain.HabitFrequency.DAILY;
import static com.quickflow.habit.domain.HabitFrequency.WEEKLY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.quickflow.common.error.BusinessRuleException;

class HabitRulesTest {

    // 2026-09-26 is a Saturday; its ISO week starts Monday 2026-09-21.
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-26T10:00:00Z"), ZoneId.of("UTC"));
    private static final LocalDate TODAY = LocalDate.now(CLOCK);

    private static LocalDate daysAgo(int n) {
        return TODAY.minusDays(n);
    }

    @Test
    void dailyDoneOnlyWhenCompletedToday() {
        assertThat(HabitRules.isDoneForPeriod(DAILY, List.of(TODAY), TODAY)).isTrue();
        assertThat(HabitRules.isDoneForPeriod(DAILY, List.of(daysAgo(1)), TODAY)).isFalse();
        assertThat(HabitRules.isDoneForPeriod(DAILY, List.of(), TODAY)).isFalse();
    }

    @Test
    void weeklyDoneWhenAnyCompletionInCurrentIsoWeek() {
        assertThat(HabitRules.isDoneForPeriod(WEEKLY, List.of(LocalDate.of(2026, 9, 21)), TODAY)).isTrue(); // Monday
        assertThat(HabitRules.isDoneForPeriod(WEEKLY, List.of(LocalDate.of(2026, 9, 20)), TODAY)).isFalse(); // prev Sunday
    }

    @Test
    void dailyStreakEndsTodayOrYesterday() {
        assertThat(HabitRules.currentStreak(DAILY, List.of(TODAY, daysAgo(1), daysAgo(2), daysAgo(4)), TODAY)).isEqualTo(3);
        assertThat(HabitRules.currentStreak(DAILY, List.of(daysAgo(1), daysAgo(2)), TODAY)).isEqualTo(2);
        assertThat(HabitRules.currentStreak(DAILY, List.of(daysAgo(2), daysAgo(3)), TODAY)).isZero();
        assertThat(HabitRules.currentStreak(DAILY, List.of(), TODAY)).isZero();
    }

    @Test
    void weeklyStreakCountsConsecutiveIsoWeeks() {
        List<LocalDate> dates = List.of(
                LocalDate.of(2026, 9, 22),  // this week
                LocalDate.of(2026, 9, 14),  // last week (Monday)
                LocalDate.of(2026, 9, 13),  // two weeks ago (Sunday)
                LocalDate.of(2026, 9, 12),  // same week as above, counted once
                LocalDate.of(2026, 8, 25)); // gap before this
        assertThat(HabitRules.currentStreak(WEEKLY, dates, TODAY)).isEqualTo(3);
        // current week not done yet: streak ends last week
        assertThat(HabitRules.currentStreak(WEEKLY, dates.subList(1, 5), TODAY)).isEqualTo(2);
    }

    @Test
    void dailyProgressIsLastSevenDays() {
        assertThat(HabitRules.progressPercent(DAILY, List.of(TODAY, daysAgo(1)), TODAY)).isEqualTo(29);
        assertThat(HabitRules.progressPercent(DAILY, List.of(TODAY, daysAgo(7)), TODAY)).isEqualTo(14); // 7 days ago is outside
        assertThat(HabitRules.progressPercent(DAILY,
                List.of(TODAY, daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5), daysAgo(6)), TODAY)).isEqualTo(100);
        assertThat(HabitRules.progressPercent(DAILY, List.of(), TODAY)).isZero();
    }

    @Test
    void weeklyProgressIsLastFourWeeksCappedAt100() {
        List<LocalDate> dates = List.of(
                LocalDate.of(2026, 9, 21), LocalDate.of(2026, 9, 22), // this week twice: counts once
                LocalDate.of(2026, 9, 1),                           // 4 weeks back window start is 2026-08-31
                LocalDate.of(2026, 8, 30));                         // outside window
        assertThat(HabitRules.progressPercent(WEEKLY, dates, TODAY)).isEqualTo(50);
        List<LocalDate> all = List.of(LocalDate.of(2026, 9, 21), LocalDate.of(2026, 9, 14),
                LocalDate.of(2026, 9, 7), LocalDate.of(2026, 8, 31), LocalDate.of(2026, 9, 25));
        assertThat(HabitRules.progressPercent(WEEKLY, all, TODAY)).isEqualTo(100);
    }

    @Test
    void completionDateCannotBeInTheFuture() {
        assertThatNoException().isThrownBy(() -> HabitRules.validateCompletionDate(TODAY, TODAY));
        assertThatNoException().isThrownBy(() -> HabitRules.validateCompletionDate(daysAgo(30), TODAY));
        assertThatThrownBy(() -> HabitRules.validateCompletionDate(TODAY.plusDays(1), TODAY))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("field").isEqualTo("date");
    }
}
