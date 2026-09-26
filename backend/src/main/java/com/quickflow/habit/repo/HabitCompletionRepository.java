package com.quickflow.habit.repo;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.habit.domain.HabitCompletion;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    List<HabitCompletion> findByHabitIdOrderByCompletionDateDesc(Long habitId);

    List<HabitCompletion> findByHabitIdIn(Collection<Long> habitIds);

    boolean existsByHabitIdAndCompletionDate(Long habitId, LocalDate completionDate);

    Optional<HabitCompletion> findByHabitIdAndCompletionDate(Long habitId, LocalDate completionDate);
}
