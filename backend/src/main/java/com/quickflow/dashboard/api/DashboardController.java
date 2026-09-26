package com.quickflow.dashboard.api;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.quickflow.dashboard.api.DashboardResponse.DashboardCard;
import com.quickflow.dashboard.api.DashboardResponse.DashboardHabits;
import com.quickflow.dashboard.api.DashboardResponse.DashboardLearning;
import com.quickflow.dashboard.api.DashboardResponse.DashboardPlans;
import com.quickflow.dashboard.api.DashboardResponse.DashboardTasks;
import com.quickflow.dashboard.service.DashboardService;
import com.quickflow.dashboard.service.DashboardService.DashboardData;
import com.quickflow.habit.api.HabitMapper;
import com.quickflow.learning.domain.LearningRules;
import com.quickflow.learning.service.LearningService.CardView;
import com.quickflow.plan.api.PlanMapper;
import com.quickflow.plan.api.PlanResponse;
import com.quickflow.plan.service.PlanService.PlanView;
import com.quickflow.task.api.TaskMapper;
import com.quickflow.task.api.TaskResponse;
import com.quickflow.task.domain.Task;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Summary of tasks, habits, plans and learning (FR-09)")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Get the dashboard",
            description = "One payload with every widget (D-50): greeting, today's/overdue/completed-today tasks, "
                    + "task completion %, today's habits, active and upcoming plans, learning snapshot. "
                    + "Computed at request time, so plan item changes show immediately (FR-08).")
    public DashboardResponse get() {
        DashboardData d = service.get();
        LocalDate today = d.today();
        return new DashboardResponse(d.greeting(), d.displayName(), d.now(), today,
                new DashboardTasks(tasks(d.tasks().dueToday(), today), tasks(d.tasks().overdue(), today),
                        tasks(d.tasks().completedToday(), today), d.tasks().totalActive(), d.tasks().doneCount(),
                        d.tasks().completionPercent()),
                new DashboardHabits(d.habits().today().stream().map(v -> HabitMapper.toResponse(v, today)).toList(),
                        d.habits().activeCount(), d.habits().completedTodayCount()),
                new DashboardPlans(plans(d.plans().active()), plans(d.plans().upcoming()),
                        d.plans().active().size()),
                new DashboardLearning(d.learning().byStatus(),
                        d.learning().inProgress().stream().map(DashboardController::card).toList(),
                        d.learning().milestonesCompletedLast7Days()));
    }

    private static List<TaskResponse> tasks(List<Task> tasks, LocalDate today) {
        return tasks.stream().map(t -> TaskMapper.toResponse(t, today)).toList();
    }

    private static List<PlanResponse> plans(List<PlanView> plans) {
        return plans.stream().map(PlanMapper::toResponse).toList();
    }

    private static DashboardCard card(CardView v) {
        return new DashboardCard(v.card().getId(), v.card().getTitle(), LearningRules.countDone(v.milestones()),
                v.milestones().size(), LearningRules.progressPercent(v.milestones()));
    }
}
