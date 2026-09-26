package com.quickflow.dashboard.api;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;

import com.quickflow.habit.api.HabitResponse;
import com.quickflow.learning.domain.LearningStatus;
import com.quickflow.plan.api.PlanResponse;
import com.quickflow.task.api.TaskResponse;

@Schema(description = "Every dashboard widget, computed from live data at serverTime (FR-09, D-50)")
public record DashboardResponse(
        @Schema(description = "\"Good morning/afternoon/evening, {displayName}\" in the app zone (D-52, A-02)",
                example = "Good morning, Friend") String greeting,
        @Schema(description = "From settings", example = "Friend") String displayName,
        @Schema(example = "2026-09-26T08:30:00Z") Instant serverTime,
        @Schema(description = "Today in the app zone", example = "2026-09-26") LocalDate today,
        DashboardTasks tasks,
        DashboardHabits habits,
        DashboardPlans plans,
        DashboardLearning learning) {

    @Schema(description = "Task widgets. Archived tasks are ignored everywhere")
    public record DashboardTasks(
            @Schema(description = "dueDate = today, any status, by id") List<TaskResponse> dueToday,
            @Schema(description = "Overdue tasks (D-12), by dueDate") List<TaskResponse> overdue,
            @Schema(description = "DONE with completedAt today, newest first") List<TaskResponse> completedToday,
            @Schema(description = "All non-archived tasks", example = "8") int totalActive,
            @Schema(description = "Non-archived DONE tasks", example = "3") int doneCount,
            @Schema(description = "doneCount ÷ totalActive, rounded, 0–100; 0 when there are no tasks (D-15)",
                    example = "38") int completionPercent) {
    }

    @Schema(description = "Habit widgets")
    public record DashboardHabits(
            @Schema(description = "Active daily habits plus active weekly habits not done this week (D-24)")
            List<HabitResponse> today,
            @Schema(description = "Active habits", example = "4") int activeCount,
            @Schema(description = "Active habits with a completion today", example = "2") int completedTodayCount) {
    }

    @Schema(description = "Plan widgets")
    public record DashboardPlans(
            @Schema(description = "IN_PROGRESS plans with progress and remainingSeconds (BR-12)")
            List<PlanResponse> active,
            @Schema(description = "Next NOT_STARTED plans by startDateTime (max 5)") List<PlanResponse> upcoming,
            @Schema(example = "1") int activeCount) {
    }

    @Schema(description = "Learning snapshot")
    public record DashboardLearning(
            @Schema(description = "Number of cards per status; every status is present",
                    example = "{\"NOT_STARTED\": 2, \"IN_PROGRESS\": 1, \"COMPLETED\": 0}")
            Map<LearningStatus, Integer> byStatus,
            @Schema(description = "IN_PROGRESS cards, by id") List<DashboardCard> inProgress,
            @Schema(description = "Milestones marked done in the last 7 days (D-30)", example = "3")
            int milestonesCompletedLast7Days) {
    }

    @Schema(description = "A learning card summary")
    public record DashboardCard(
            @Schema(example = "1") Long id,
            @Schema(example = "Spring Boot in Action") String title,
            @Schema(example = "1") int milestonesDone,
            @Schema(example = "2") int milestonesTotal,
            @Schema(example = "50") int progressPercent) {
    }
}
