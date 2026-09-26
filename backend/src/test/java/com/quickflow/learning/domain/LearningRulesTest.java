package com.quickflow.learning.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;

class LearningRulesTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-26T10:00:00Z"), ZoneId.of("UTC"));
    private static final Instant NOW = CLOCK.instant();

    private static LearningMilestone milestone(boolean done) {
        LearningMilestone m = new LearningMilestone(1L, "step", null, 0);
        if (done) {
            LearningRules.markMilestone(m, true, NOW);
        }
        return m;
    }

    @Test
    void statusIsNotStartedWithoutMilestonesOrWithNoneDone() {
        assertThat(LearningRules.deriveStatus(List.of())).isEqualTo(LearningStatus.NOT_STARTED);
        assertThat(LearningRules.deriveStatus(List.of(milestone(false), milestone(false))))
                .isEqualTo(LearningStatus.NOT_STARTED);
    }

    @Test
    void statusIsInProgressWhenSomeDoneAndCompletedWhenAllDone() {
        assertThat(LearningRules.deriveStatus(List.of(milestone(true), milestone(false))))
                .isEqualTo(LearningStatus.IN_PROGRESS);
        assertThat(LearningRules.deriveStatus(List.of(milestone(true), milestone(true))))
                .isEqualTo(LearningStatus.COMPLETED);
    }

    @Test
    void markingDoneSetsCompletedAtAndUnmarkingClearsIt() {
        LearningMilestone m = milestone(false);
        LearningRules.markMilestone(m, true, NOW);
        assertThat(m.isDone()).isTrue();
        assertThat(m.getCompletedAt()).isEqualTo(NOW);

        LearningRules.markMilestone(m, true, NOW.plus(Duration.ofHours(1)));
        assertThat(m.getCompletedAt()).as("re-marking keeps the original time").isEqualTo(NOW);

        LearningRules.markMilestone(m, false, NOW);
        assertThat(m.isDone()).isFalse();
        assertThat(m.getCompletedAt()).isNull();
    }

    @Test
    void progressPercentIsRoundedShareOfDoneMilestones() {
        assertThat(LearningRules.progressPercent(List.of())).isZero();
        assertThat(LearningRules.progressPercent(List.of(milestone(true), milestone(false)))).isEqualTo(50);
        assertThat(LearningRules.progressPercent(List.of(milestone(true), milestone(false), milestone(false))))
                .isEqualTo(33);
        assertThat(LearningRules.progressPercent(List.of(milestone(true), milestone(true), milestone(false))))
                .isEqualTo(67);
        assertThat(LearningRules.countDone(List.of(milestone(true), milestone(false)))).isEqualTo(1);
    }
}
