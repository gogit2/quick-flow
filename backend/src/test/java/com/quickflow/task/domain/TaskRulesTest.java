package com.quickflow.task.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

class TaskRulesTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-26T10:00:00Z"), ZoneId.of("UTC"));
    private static final Instant NOW = CLOCK.instant();
    private static final LocalDate TODAY = LocalDate.now(CLOCK);

    private static Task task(LocalDate due) {
        return new Task("t", null, TaskPriority.MEDIUM, due, NOW.minusSeconds(3600));
    }

    @Test
    void doneSetsCompletedAtAndLeavingDoneClearsIt() {
        Task t = task(null);
        TaskRules.applyStatus(t, TaskStatus.DONE, NOW);
        assertThat(t.getStatus()).isEqualTo(TaskStatus.DONE);
        assertThat(t.getCompletedAt()).isEqualTo(NOW);

        TaskRules.applyStatus(t, TaskStatus.TODO, NOW.plusSeconds(60));
        assertThat(t.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(t.getCompletedAt()).isNull();
    }

    @Test
    void reapplyingDoneKeepsOriginalCompletionTime() {
        Task t = task(null);
        TaskRules.applyStatus(t, TaskStatus.DONE, NOW);
        TaskRules.applyStatus(t, TaskStatus.DONE, NOW.plusSeconds(600));
        assertThat(t.getCompletedAt()).isEqualTo(NOW);
    }

    @Test
    void inProgressHasNoCompletedAt() {
        Task t = task(null);
        TaskRules.applyStatus(t, TaskStatus.IN_PROGRESS, NOW);
        assertThat(t.getCompletedAt()).isNull();
    }

    @Test
    void overdueOnlyWhenDueBeforeTodayAndOpenAndNotArchived() {
        assertThat(TaskRules.isOverdue(task(TODAY.minusDays(1)), TODAY)).isTrue();
        assertThat(TaskRules.isOverdue(task(TODAY), TODAY)).isFalse();
        assertThat(TaskRules.isOverdue(task(TODAY.plusDays(1)), TODAY)).isFalse();
        assertThat(TaskRules.isOverdue(task(null), TODAY)).isFalse();

        Task done = task(TODAY.minusDays(3));
        TaskRules.applyStatus(done, TaskStatus.DONE, NOW);
        assertThat(TaskRules.isOverdue(done, TODAY)).isFalse();

        Task archived = task(TODAY.minusDays(3));
        archived.setArchived(true);
        assertThat(TaskRules.isOverdue(archived, TODAY)).isFalse();

        Task inProgress = task(TODAY.minusDays(1));
        TaskRules.applyStatus(inProgress, TaskStatus.IN_PROGRESS, NOW);
        assertThat(TaskRules.isOverdue(inProgress, TODAY)).isTrue();
    }
}
