package com.quickflow.task.domain;

import java.time.Instant;
import java.time.LocalDate;

/** Pure task rules (no Spring). */
public final class TaskRules {

    private TaskRules() {
    }

    /**
     * D-11 / BR-5: sets the status; {@code completedAt} is set when the task becomes DONE and cleared when it
     * leaves DONE. Re-applying DONE keeps the original completion time.
     */
    public static void applyStatus(Task task, TaskStatus newStatus, Instant now) {
        if (newStatus == TaskStatus.DONE) {
            if (task.getStatus() != TaskStatus.DONE || task.getCompletedAt() == null) {
                task.setCompletedAt(now);
            }
        } else {
            task.setCompletedAt(null);
        }
        task.setStatus(newStatus);
    }

    /** D-12: due before today, not DONE, not archived. */
    public static boolean isOverdue(Task task, LocalDate today) {
        return task.getDueDate() != null
                && task.getDueDate().isBefore(today)
                && task.getStatus() != TaskStatus.DONE
                && !task.isArchived();
    }
}
