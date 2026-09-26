package com.quickflow.plan.domain;

/** What marking a plan item changes on its source (BR-13, D-47). */
public enum PlanItemEffect {
    COMPLETE_TASK,
    COMPLETE_HABIT_TODAY,
    NONE
}
