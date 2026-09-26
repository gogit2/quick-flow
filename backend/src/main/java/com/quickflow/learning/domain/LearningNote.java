package com.quickflow.learning.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A free-form note under one learning card (FR-06). */
@Entity
@Table(name = "learning_note")
public class LearningNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false)
    private Long cardId;

    @Column(nullable = false, length = 5000)
    private String text;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LearningNote() {
    }

    public LearningNote(Long cardId, String text, Instant createdAt) {
        this.cardId = cardId;
        this.text = text;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getCardId() {
        return cardId;
    }

    public String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
