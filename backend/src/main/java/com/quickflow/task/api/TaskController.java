package com.quickflow.task.api;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.quickflow.task.domain.Task;
import com.quickflow.task.domain.TaskPriority;
import com.quickflow.task.domain.TaskStatus;
import com.quickflow.task.service.TaskService;
import com.quickflow.task.service.TaskService.TaskQuery;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks", description = "Tasks: CRUD, complete, archive/restore, search and filters (FR-01, FR-02)")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List and search tasks",
            description = "Filters combine with AND. Archived tasks are excluded unless `archived=true` (which lists only "
                    + "archived ones). Sort by `createdAt` (default, newest first) or `dueDate` (default ascending); "
                    + "tasks without a due date always sort last.")
    @ApiResponse(responseCode = "400", description = "Invalid filter, sort or dir")
    public List<TaskResponse> list(
            @Parameter(description = "Case-insensitive substring of the title") @RequestParam(required = false) String q,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @Parameter(description = "Exact due date")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate,
            @Parameter(description = "Due on or after this date")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @Parameter(description = "Due on or before this date")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @Parameter(description = "false (default) = active tasks, true = archived tasks only")
            @RequestParam(required = false, defaultValue = "false") boolean archived,
            @Parameter(schema = @Schema(allowableValues = {"createdAt", "dueDate"}, defaultValue = "createdAt"))
            @RequestParam(required = false) String sort,
            @Parameter(schema = @Schema(allowableValues = {"asc", "desc"}))
            @RequestParam(required = false) String dir) {
        LocalDate today = service.today();
        return service.search(new TaskQuery(q, status, priority, dueDate, dueFrom, dueTo, archived, sort, dir))
                .stream().map(t -> TaskMapper.toResponse(t, today)).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a task")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public TaskResponse get(@PathVariable Long id) {
        return respond(service.get(id));
    }

    @PostMapping
    @Operation(summary = "Create a task", description = "Status defaults to TODO, priority to MEDIUM.")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskRequest req) {
        TaskResponse body = respond(service.create(TaskMapper.toInput(req)));
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + body.id())).body(body);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a task",
            description = "Setting status to DONE sets `completedAt`; leaving DONE clears it.")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest req) {
        return respond(service.update(id, TaskMapper.toInput(req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task", description = "Hard delete (BR-14).")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete a task", description = "Sets status DONE and `completedAt`.")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public TaskResponse complete(@PathVariable Long id) {
        return respond(service.complete(id));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a task", description = "Hidden from the default list; see `archived=true`.")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public TaskResponse archive(@PathVariable Long id) {
        return respond(service.setArchived(id, true));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore an archived task")
    @ApiResponse(responseCode = "404", description = "Task not found")
    public TaskResponse restore(@PathVariable Long id) {
        return respond(service.setArchived(id, false));
    }

    private TaskResponse respond(Task task) {
        return TaskMapper.toResponse(task, service.today());
    }
}
