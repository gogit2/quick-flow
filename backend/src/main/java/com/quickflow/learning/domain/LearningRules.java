package com.quickflow.learning.domain;

import java.time.Instant;
import java.util.List;

/** Pure learning-card rules (D-30, D-31). No Spring, no clock lookups: "now" is passed in. */
public final class LearningRules {

    private LearningRules() {
    }

    /** D-31: none done → NOT_STARTED; some done → IN_PROGRESS; all done (≥ 1 milestone) → COMPLETED. */
    public static LearningStatus deriveStatus(List<LearningMilestone> milestones) {
        long done = countDone(milestones);
        if (done == 0) {
            return LearningStatus.NOT_STARTED;
        }
        return done == milestones.size() ? LearningStatus.COMPLETED : LearningStatus.IN_PROGRESS;
    }

    /**
     * D-30: marking done sets {@code completedAt} to now; un-marking clears it. Re-marking an already done
     * milestone keeps its original {@code completedAt}.
     */
    public static void markMilestone(LearningMilestone milestone, boolean done, Instant now) {
        if (done && !milestone.isDone()) {
            milestone.setCompletedAt(now);
        } else if (!done) {
            milestone.setCompletedAt(null);
        }
        milestone.setDone(done);
    }

    /** Done milestones ÷ all milestones, rounded to an integer 0–100. 0 when there are none. */
    public static int progressPercent(List<LearningMilestone> milestones) {
        if (milestones.isEmpty()) {
            return 0;
        }
        return (int) Math.round(countDone(milestones) * 100.0 / milestones.size());
    }

    public static int countDone(List<LearningMilestone> milestones) {
        return (int) milestones.stream().filter(LearningMilestone::isDone).count();
    }
}
