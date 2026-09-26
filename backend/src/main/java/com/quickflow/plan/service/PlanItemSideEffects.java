package com.quickflow.plan.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.habit.service.HabitService;
import com.quickflow.plan.domain.PlanItem;
import com.quickflow.plan.domain.PlanRules;
import com.quickflow.task.service.TaskService;

/** Applies the BR-13 / D-47 side effect of marking a plan item on its source. */
@Service
@Transactional
public class PlanItemSideEffects {

    private final TaskService tasks;
    private final HabitService habits;

    public PlanItemSideEffects(TaskService tasks, HabitService habits) {
        this.tasks = tasks;
        this.habits = habits;
    }

    public void apply(PlanItem item, boolean done) {
        switch (PlanRules.sideEffect(item.getSourceType(), done)) {
            case COMPLETE_TASK:
                tasks.complete(item.getSourceId());
                break;
            case COMPLETE_HABIT_TODAY:
                habits.recordCompletionIfAbsent(item.getSourceId(), habits.today());
                break;
            default:
                break;
        }
    }
}
