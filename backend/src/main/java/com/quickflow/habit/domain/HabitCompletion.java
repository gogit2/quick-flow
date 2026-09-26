package com.quickflow.habit.domain;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One completion of a habit on a date. Unique per (habit, date) (BR-7); cascades on habit delete in the DB (D-25). */
@Entity
@Table(name = "habit_completion")
public class HabitCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "completion_date", nullable = false)
    private LocalDate completionDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected HabitCompletion() {
    }

    public HabitCompletion(Long habitId, LocalDate completionDate, Instant createdAt) {
        this.habitId = habitId;
        this.completionDate = completionDate;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getHabitId() {
        return habitId;
    }

    public LocalDate getCompletionDate() {
        return completionDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
