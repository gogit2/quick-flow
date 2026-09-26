package com.quickflow.dashboard.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.common.time.AppTime;
import com.quickflow.dashboard.domain.DashboardRules;
import com.quickflow.habit.service.HabitService;
import com.quickflow.habit.service.HabitService.HabitView;
import com.quickflow.learning.domain.LearningStatus;
import com.quickflow.learning.service.LearningService;
import com.quickflow.learning.service.LearningService.CardView;
import com.quickflow.plan.domain.PlanStatus;
import com.quickflow.plan.service.PlanService;
import com.quickflow.plan.service.PlanService.PlanView;
import com.quickflow.settings.service.SettingsService;
import com.quickflow.task.domain.Task;
import com.quickflow.task.domain.TaskRules;
import com.quickflow.task.domain.TaskStatus;
import com.quickflow.task.service.TaskService;
import com.quickflow.task.service.TaskService.TaskQuery;

/** Read model for GET /dashboard (FR-09, D-50): every widget computed from live data at one instant. */
@Service
@Transactional
public class DashboardService {

    static final int UPCOMING_PLAN_LIMIT = 5;

    public record TaskSummary(List<Task> dueToday, List<Task> overdue, List<Task> completedToday, int totalActive,
            int doneCount, int completionPercent) {
    }

    public record HabitSummary(List<HabitView> today, int activeCount, int completedTodayCount) {
    }

    public record PlanSummary(List<PlanView> active, List<PlanView> upcoming) {
    }

    public record LearningSummary(Map<LearningStatus, Integer> byStatus, List<CardView> inProgress,
            int milestonesCompletedLast7Days) {
    }

    public record DashboardData(String greeting, String displayName, Instant now, LocalDate today,
            TaskSummary tasks, HabitSummary habits, PlanSummary plans, LearningSummary learning) {
    }

    private final TaskService taskService;
    private final HabitService habitService;
    private final PlanService planService;
    private final LearningService learningService;
    private final SettingsService settingsService;
    private final AppTime time;

    public DashboardService(TaskService taskService, HabitService habitService, PlanService planService,
            LearningService learningService, SettingsService settingsService, AppTime time) {
        this.taskService = taskService;
        this.habitService = habitService;
        this.planService = planService;
        this.learningService = learningService;
        this.settingsService = settingsService;
        this.time = time;
    }

    public DashboardData get() {
        Instant now = time.now();
        LocalDate today = now.atZone(time.zone()).toLocalDate();
        LocalTime localTime = now.atZone(time.zone()).toLocalTime();
        String displayName = settingsService.get().getDisplayName();
        return new DashboardData(DashboardRules.greeting(displayName, localTime), displayName, now, today,
                tasks(today), habits(today), plans(), learning(now));
    }

    /** US-DASH-01/02/04, D-15. Archived tasks are ignored everywhere. */
    private TaskSummary tasks(LocalDate today) {
        List<Task> active = taskService.search(new TaskQuery(null, null, null, null, null, null, false, "dueDate", null));
        List<Task> dueToday = active.stream().filter(t -> today.equals(t.getDueDate())).toList();
        List<Task> overdue = active.stream().filter(t -> TaskRules.isOverdue(t, today)).toList();
        List<Task> completedToday = active.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && DashboardRules.isOnDay(t.getCompletedAt(), today, time.zone()))
                .sorted(Comparator.comparing(Task::getCompletedAt).reversed())
                .toList();
        int done = (int) active.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        return new TaskSummary(dueToday, overdue, completedToday, active.size(), done,
                DashboardRules.completionPercent(done, active.size()));
    }

    /** US-DASH-03, D-24. */
    private HabitSummary habits(LocalDate today) {
        List<HabitView> active = habitService.list(true);
        List<HabitView> todays = active.stream()
                .filter(v -> DashboardRules.isTodaysHabit(v.habit().getFrequency(), v.habit().isActive(),
                        v.completionDates(), today))
                .toList();
        int completedToday = (int) active.stream().filter(v -> v.completionDates().contains(today)).count();
        return new HabitSummary(todays, active.size(), completedToday);
    }

    /** US-DASH-05: IN_PROGRESS plans in list order (D-41); next NOT_STARTED plans by start. */
    private PlanSummary plans() {
        List<PlanView> all = planService.list(null);
        List<PlanView> active = all.stream().filter(v -> v.status() == PlanStatus.IN_PROGRESS).toList();
        List<PlanView> upcoming = all.stream().filter(v -> v.status() == PlanStatus.NOT_STARTED)
                .sorted(Comparator.<PlanView, Instant>comparing(v -> v.plan().getStartDateTime())
                        .thenComparing(v -> v.plan().getId()))
                .limit(UPCOMING_PLAN_LIMIT)
                .toList();
        return new PlanSummary(active, upcoming);
    }

    /** US-DASH-06, D-30. */
    private LearningSummary learning(Instant now) {
        List<CardView> cards = learningService.list();
        Map<LearningStatus, Integer> byStatus = new EnumMap<>(LearningStatus.class);
        for (LearningStatus s : LearningStatus.values()) {
            byStatus.put(s, 0);
        }
        cards.forEach(c -> byStatus.merge(c.card().getStatus(), 1, Integer::sum));
        List<CardView> inProgress = cards.stream().filter(c -> c.card().getStatus() == LearningStatus.IN_PROGRESS)
                .toList();
        int recent = (int) cards.stream().flatMap(c -> c.milestones().stream())
                .filter(m -> m.isDone() && DashboardRules.isRecentMilestone(m.getCompletedAt(), now))
                .count();
        return new LearningSummary(byStatus, inProgress, recent);
    }
}
