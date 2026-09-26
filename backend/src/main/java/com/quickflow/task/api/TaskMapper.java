package com.quickflow.task.api;

import java.time.LocalDate;

import com.quickflow.task.domain.Task;
import com.quickflow.task.domain.TaskRules;
import com.quickflow.task.service.TaskService.TaskInput;

final class TaskMapper {

    private TaskMapper() {
    }

    static TaskResponse toResponse(Task t, LocalDate today) {
        return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(),
                t.getDueDate(), t.getCreatedAt(), t.getUpdatedAt(), t.getCompletedAt(), t.isArchived(),
                TaskRules.isOverdue(t, today));
    }

    static TaskInput toInput(TaskRequest r) {
        return new TaskInput(r.title(), r.description(), r.status(), r.priority(), r.dueDate());
    }
}
