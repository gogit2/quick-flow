package com.quickflow.plan.service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.quickflow.common.time.AppTime;
import com.quickflow.habit.domain.Habit;
import com.quickflow.habit.domain.HabitCompletion;
import com.quickflow.habit.domain.HabitRules;
import com.quickflow.habit.repo.HabitCompletionRepository;
import com.quickflow.habit.repo.HabitRepository;
import com.quickflow.learning.repo.LearningCardRepository;
import com.quickflow.plan.domain.PlanSourceType;
import com.quickflow.task.repo.TaskRepository;

/**
 * Looks up the entities plan items point at, in batches (one query per source type). {@code sourceStatus} is
 * the task status, the learning card status, or for a habit {@code DONE} / {@code PENDING} / {@code INACTIVE}
 * for its current period (A-08).
 */
@Component
public class PlanSourceResolver {

    public record SourceKey(PlanSourceType type, Long id) {
    }

    public record SourceInfo(String title, String status) {
    }

    private final TaskRepository tasks;
    private final HabitRepository habits;
    private final HabitCompletionRepository completions;
    private final LearningCardRepository cards;
    private final AppTime time;

    public PlanSourceResolver(TaskRepository tasks, HabitRepository habits, HabitCompletionRepository completions,
            LearningCardRepository cards, AppTime time) {
        this.tasks = tasks;
        this.habits = habits;
        this.completions = completions;
        this.cards = cards;
        this.time = time;
    }

    /** Resolves every key that exists; missing sources are absent from the map. */
    public Map<SourceKey, SourceInfo> resolve(Collection<SourceKey> keys) {
        Map<SourceKey, SourceInfo> out = new HashMap<>();
        tasks.findAllById(ids(keys, PlanSourceType.TASK)).forEach(t -> out.put(
                new SourceKey(PlanSourceType.TASK, t.getId()), new SourceInfo(t.getTitle(), t.getStatus().name())));
        cards.findAllById(ids(keys, PlanSourceType.LEARNING_RESOURCE)).forEach(c -> out.put(
                new SourceKey(PlanSourceType.LEARNING_RESOURCE, c.getId()),
                new SourceInfo(c.getTitle(), c.getStatus().name())));
        List<Habit> found = habits.findAllById(ids(keys, PlanSourceType.HABIT));
        if (!found.isEmpty()) {
            LocalDate today = time.today();
            Map<Long, List<LocalDate>> datesByHabit = completions
                    .findByHabitIdIn(found.stream().map(Habit::getId).toList()).stream()
                    .collect(Collectors.groupingBy(HabitCompletion::getHabitId,
                            Collectors.mapping(HabitCompletion::getCompletionDate, Collectors.toList())));
            for (Habit h : found) {
                String status = !h.isActive() ? "INACTIVE"
                        : HabitRules.isDoneForPeriod(h.getFrequency(), datesByHabit.getOrDefault(h.getId(), List.of()),
                                today) ? "DONE" : "PENDING";
                out.put(new SourceKey(PlanSourceType.HABIT, h.getId()), new SourceInfo(h.getName(), status));
            }
        }
        return out;
    }

    private static Set<Long> ids(Collection<SourceKey> keys, PlanSourceType type) {
        return keys.stream().filter(k -> k.type() == type).map(SourceKey::id).collect(Collectors.toSet());
    }
}
