package com.quickflow.plan.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.quickflow.common.error.BusinessRuleException;

class PlanRulesTest {

    private static final Instant START = Instant.parse("2026-09-26T10:00:00Z");
    private static final Instant END = Instant.parse("2026-09-26T11:00:00Z");

    private static Instant at(Duration offsetFromStart) {
        return Clock.offset(Clock.fixed(START, ZoneId.of("UTC")), offsetFromStart).instant();
    }

    @Test
    void lifecycleNotStartedThenInProgressThenCompletedByTime() {
        Instant before = at(Duration.ofMinutes(-5));
        Instant during = at(Duration.ofMinutes(10));
        Instant after = at(Duration.ofMinutes(60));

        assertThat(PlanRules.status(START, END, 0, 3, before)).isEqualTo(PlanStatus.NOT_STARTED);
        assertThat(PlanRules.status(START, END, 0, 3, START)).isEqualTo(PlanStatus.IN_PROGRESS);
        assertThat(PlanRules.status(START, END, 1, 3, during)).isEqualTo(PlanStatus.IN_PROGRESS);
        assertThat(PlanRules.status(START, END, 1, 3, after)).isEqualTo(PlanStatus.COMPLETED);
    }

    @Test
    void allItemsDoneCompletesEvenBeforeEndButEmptyPlanDoesNot() {
        assertThat(PlanRules.status(START, END, 3, 3, at(Duration.ofMinutes(10)))).isEqualTo(PlanStatus.COMPLETED);
        assertThat(PlanRules.status(START, END, 2, 2, at(Duration.ofMinutes(-30)))).isEqualTo(PlanStatus.COMPLETED);
        assertThat(PlanRules.status(START, END, 0, 0, at(Duration.ofMinutes(10)))).isEqualTo(PlanStatus.IN_PROGRESS);
    }

    @Test
    void progressPercentRoundsAndIsZeroWithoutItems() {
        assertThat(PlanRules.progressPercent(0, 0)).isZero();
        assertThat(PlanRules.progressPercent(1, 3)).isEqualTo(33);
        assertThat(PlanRules.progressPercent(2, 3)).isEqualTo(67);
        assertThat(PlanRules.progressPercent(3, 3)).isEqualTo(100);
    }

    @Test
    void remainingSecondsOnlyWhileInProgress() {
        Instant during = at(Duration.ofMinutes(10));
        assertThat(PlanRules.remainingSeconds(PlanStatus.IN_PROGRESS, END, during)).isEqualTo(3000L);
        assertThat(PlanRules.remainingSeconds(PlanStatus.NOT_STARTED, END, during)).isNull();
        assertThat(PlanRules.remainingSeconds(PlanStatus.COMPLETED, END, during)).isNull();
    }

    @Test
    void startsInSecondsOnlyWhileNotStarted() {
        Instant before = at(Duration.ofMinutes(-5));
        assertThat(PlanRules.startsInSeconds(PlanStatus.NOT_STARTED, START, before)).isEqualTo(300L);
        assertThat(PlanRules.startsInSeconds(PlanStatus.IN_PROGRESS, START, before)).isNull();
    }

    @Test
    void windowMustEndAfterStart() {
        PlanRules.validateWindow(START, END);
        assertThatThrownBy(() -> PlanRules.validateWindow(START, START))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("field").isEqualTo("endDateTime");
        assertThatThrownBy(() -> PlanRules.validateWindow(END, START)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void groupRankOrdersInProgressThenNotStartedThenCompleted() {
        assertThat(PlanRules.groupRank(PlanStatus.IN_PROGRESS)).isLessThan(PlanRules.groupRank(PlanStatus.NOT_STARTED));
        assertThat(PlanRules.groupRank(PlanStatus.NOT_STARTED)).isLessThan(PlanRules.groupRank(PlanStatus.COMPLETED));
    }

    @Test
    void markingLastItemDoneCompletesBeforeEndAndUnmarkingReopens() {
        Instant during = at(Duration.ofMinutes(20));
        assertThat(PlanRules.status(START, END, 2, 3, during)).isEqualTo(PlanStatus.IN_PROGRESS);
        assertThat(PlanRules.status(START, END, 3, 3, during)).isEqualTo(PlanStatus.COMPLETED);
        assertThat(PlanRules.remainingSeconds(PlanRules.status(START, END, 3, 3, during), END, during)).isNull();
        assertThat(PlanRules.progressPercent(1, 3)).isEqualTo(33);
        assertThat(PlanRules.status(START, END, 2, 3, during)).isEqualTo(PlanStatus.IN_PROGRESS);
    }

    @Test
    void sideEffectPerSourceType() {
        assertThat(PlanRules.sideEffect(PlanSourceType.TASK, true)).isEqualTo(PlanItemEffect.COMPLETE_TASK);
        assertThat(PlanRules.sideEffect(PlanSourceType.HABIT, true)).isEqualTo(PlanItemEffect.COMPLETE_HABIT_TODAY);
        assertThat(PlanRules.sideEffect(PlanSourceType.LEARNING_RESOURCE, true)).isEqualTo(PlanItemEffect.NONE);
    }

    @Test
    void unmarkingNeverRevertsTheSource() {
        for (PlanSourceType type : PlanSourceType.values()) {
            assertThat(PlanRules.sideEffect(type, false)).isEqualTo(PlanItemEffect.NONE);
        }
    }
}
