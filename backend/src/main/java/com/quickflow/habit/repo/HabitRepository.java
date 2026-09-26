package com.quickflow.habit.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.habit.domain.Habit;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findAllByOrderByIdAsc();

    List<Habit> findByActiveOrderByIdAsc(boolean active);
}
