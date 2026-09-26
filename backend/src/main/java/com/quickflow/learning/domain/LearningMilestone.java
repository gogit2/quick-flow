package com.quickflow.learning.domain;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A step under exactly one learning card (BR-9). {@code completedAt} is set while done (D-30). */
@Entity
@Table(name = "learning_milestone")
public class LearningMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false)
    private Long cardId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private boolean done;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(nullable = false)
    private int position;

    protected LearningMilestone() {
    }

    public LearningMilestone(Long cardId, String title, LocalDate targetDate, int position) {
        this.cardId = cardId;
        this.title = title;
        this.targetDate = targetDate;
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public Long getCardId() {
        return cardId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public int getPosition() {
        return position;
    }
}
