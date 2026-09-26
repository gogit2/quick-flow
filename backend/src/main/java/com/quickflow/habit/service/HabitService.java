package com.quickflow.habit.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.common.error.ConflictException;
import com.quickflow.common.error.NotFoundException;
import com.quickflow.common.time.AppTime;
import com.quickflow.habit.domain.Habit;
import com.quickflow.habit.domain.HabitCompletion;
import com.quickflow.habit.domain.HabitFrequency;
import com.quickflow.habit.domain.HabitRules;
import com.quickflow.habit.repo.HabitCompletionRepository;
import com.quickflow.habit.repo.HabitRepository;

@Service
@Transactional
public class HabitService {

    /** A habit with all its completion dates, newest first; enough to compute every derived field. */
    public record HabitView(Habit habit, List<LocalDate> completionDates) {
    }

    private final HabitRepository habits;
    private final HabitCompletionRepository completions;
    private final AppTime time;

    public HabitService(HabitRepository habits, HabitCompletionRepository completions, AppTime time) {
        this.habits = habits;
        this.completions = completions;
        this.time = time;
    }

    @Transactional(readOnly = true)
    public List<HabitView> list(Boolean active) {
        List<Habit> found = active == null ? habits.findAllByOrderByIdAsc() : habits.findByActiveOrderByIdAsc(active);
        if (found.isEmpty()) {
            return List.of();
        }
        Map<Long, List<LocalDate>> datesByHabit = completions
                .findByHabitIdIn(found.stream().map(Habit::getId).toList()).stream()
                .collect(Collectors.groupingBy(HabitCompletion::getHabitId,
                        Collectors.mapping(HabitCompletion::getCompletionDate, Collectors.toList())));
        return found.stream()
                .map(h -> new HabitView(h, sortedDesc(datesByHabit.getOrDefault(h.getId(), List.of()))))
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitView get(Long id) {
        return view(find(id));
    }

    public HabitView create(String name, String description, HabitFrequency frequency) {
        Habit habit = habits.save(new Habit(name.trim(), description, frequency, time.now()));
        return new HabitView(habit, List.of());
    }

    public HabitView update(Long id, String name, String description, HabitFrequency frequency) {
        Habit habit = find(id);
        habit.setName(name.trim());
        habit.setDescription(description);
        habit.setFrequency(frequency);
        return view(habit);
    }

    public void delete(Long id) {
        habits.delete(find(id)); // completions cascade in the DB (D-25)
    }

    public HabitView setActive(Long id, boolean active) {
        Habit habit = find(id);
        habit.setActive(active);
        return view(habit);
    }

    /** D-20: record a completion for {@code date} (default today). Future → 400, duplicate → 409. */
    public HabitCompletion complete(Long id, LocalDate date) {
        Habit habit = find(id);
        LocalDate today = time.today();
        LocalDate day = date == null ? today : date;
        HabitRules.validateCompletionDate(day, today);
        if (completions.existsByHabitIdAndCompletionDate(habit.getId(), day)) {
            throw new ConflictException("Habit " + id + " is already completed on " + day);
        }
        try {
            return completions.saveAndFlush(new HabitCompletion(habit.getId(), day, time.now()));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Habit " + id + " is already completed on " + day);
        }
    }

    /** Removes the completion on {@code date} (default today). 404 if there is none. */
    public void uncomplete(Long id, LocalDate date) {
        Habit habit = find(id);
        LocalDate day = date == null ? time.today() : date;
        HabitCompletion completion = completions.findByHabitIdAndCompletionDate(habit.getId(), day)
                .orElseThrow(() -> new NotFoundException("Habit " + id + " has no completion on " + day));
        completions.delete(completion);
    }

    @Transactional(readOnly = true)
    public List<HabitCompletion> completions(Long id) {
        return completions.findByHabitIdOrderByCompletionDateDesc(find(id).getId());
    }

    /** D-47 (used by plan items in M06): complete for today, silently ignoring an existing completion. */
    public void recordCompletionIfAbsent(Long habitId, LocalDate today) {
        Habit habit = find(habitId);
        if (!completions.existsByHabitIdAndCompletionDate(habit.getId(), today)) {
            completions.save(new HabitCompletion(habit.getId(), today, time.now()));
        }
    }

    public LocalDate today() {
        return time.today();
    }

    private Habit find(Long id) {
        return habits.findById(id).orElseThrow(() -> NotFoundException.of("Habit", id));
    }

    private HabitView view(Habit habit) {
        List<LocalDate> dates = completions.findByHabitIdOrderByCompletionDateDesc(habit.getId()).stream()
                .map(HabitCompletion::getCompletionDate)
                .toList();
        return new HabitView(habit, dates);
    }

    private static List<LocalDate> sortedDesc(List<LocalDate> dates) {
        return dates.stream().sorted((a, b) -> b.compareTo(a)).toList();
    }
}
