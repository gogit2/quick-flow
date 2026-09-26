package com.quickflow.habit.api;

import java.time.Instant;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.habit.domain.HabitFrequency;

@Schema(description = "A habit with its computed progress fields")
public record HabitResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Read 20 pages") String name,
        @Schema(example = "Before bed", nullable = true) String description,
        @Schema(example = "DAILY") HabitFrequency frequency,
        @Schema(example = "true") boolean active,
        @Schema(example = "2026-09-26T15:00:00Z") Instant createdAt,
        @Schema(description = "A completion exists for today (any frequency)", example = "true") boolean doneToday,
        @Schema(description = "Daily: done today. Weekly: at least one completion in the current ISO week", example = "true")
        boolean doneThisPeriod,
        @Schema(description = "Consecutive days (daily) or ISO weeks (weekly) completed, ending now or in the previous period",
                example = "3") int currentStreak,
        @Schema(description = "Daily: completed days in the last 7 ÷ 7. Weekly: completed weeks in the last 4 ÷ 4. 0–100",
                example = "43") int progressPercent,
        @Schema(example = "2026-09-26", nullable = true) LocalDate lastCompletedDate) {
}
