package com.quickflow.plan.domain;

import java.time.Duration;
import java.time.Instant;

import com.quickflow.common.error.BusinessRuleException;

/** Pure plan rules: derived status (D-43), progress (D-44), rest time (BR-12), window (BR-11), list order (D-41). */
public final class PlanRules {

    private PlanRules() {
    }

    /** D-43: COMPLETED if all items done (at least one) or now ≥ end; IN_PROGRESS if start ≤ now < end. */
    public static PlanStatus status(Instant start, Instant end, int doneItems, int totalItems, Instant now) {
        if ((totalItems > 0 && doneItems >= totalItems) || !now.isBefore(end)) {
            return PlanStatus.COMPLETED;
        }
        if (!now.isBefore(start)) {
            return PlanStatus.IN_PROGRESS;
        }
        return PlanStatus.NOT_STARTED;
    }

    /** Done ÷ total, rounded, 0–100; 0 when there are no items. */
    public static int progressPercent(int doneItems, int totalItems) {
        if (totalItems <= 0) {
            return 0;
        }
        return (int) Math.round(doneItems * 100.0 / totalItems);
    }

    /** BR-12: seconds until end, only while IN_PROGRESS; otherwise null. */
    public static Long remainingSeconds(PlanStatus status, Instant end, Instant now) {
        if (status != PlanStatus.IN_PROGRESS) {
            return null;
        }
        return Math.max(0, Duration.between(now, end).getSeconds());
    }

    /** A-01: seconds until start, only while NOT_STARTED; otherwise null. */
    public static Long startsInSeconds(PlanStatus status, Instant start, Instant now) {
        if (status != PlanStatus.NOT_STARTED) {
            return null;
        }
        return Math.max(0, Duration.between(now, start).getSeconds());
    }

    /** BR-11: the end must be strictly after the start. */
    public static void validateWindow(Instant start, Instant end) {
        if (!end.isAfter(start)) {
            throw new BusinessRuleException("endDateTime", "End date/time must be after the start date/time");
        }
    }

    /**
     * BR-13 / D-47: the side effect of setting an item to {@code done}. Task → DONE, habit → today's completion,
     * learning → none. Un-marking ({@code done == false}) never reverts the source.
     */
    public static PlanItemEffect sideEffect(PlanSourceType type, boolean done) {
        if (!done) {
            return PlanItemEffect.NONE;
        }
        switch (type) {
            case TASK:
                return PlanItemEffect.COMPLETE_TASK;
            case HABIT:
                return PlanItemEffect.COMPLETE_HABIT_TODAY;
            default:
                return PlanItemEffect.NONE;
        }
    }

    /** D-41: list group rank — IN_PROGRESS first, then NOT_STARTED, then COMPLETED. */
    public static int groupRank(PlanStatus status) {
        switch (status) {
            case IN_PROGRESS:
                return 0;
            case NOT_STARTED:
                return 1;
            default:
                return 2;
        }
    }
}
