package com.quickflow.habit.api;

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
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.quickflow.habit.domain.HabitCompletion;
import com.quickflow.habit.service.HabitService;
import com.quickflow.habit.service.HabitService.HabitView;

@RestController
@RequestMapping("/api/v1/habits")
@Tag(name = "Habits", description = "Recurring habits and their completions (FR-03, FR-04)")
public class HabitController {

    private final HabitService service;

    public HabitController(HabitService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List habits", description = "All habits by id; filter with `active`.")
    public List<HabitResponse> list(
            @Parameter(description = "true = active only, false = deactivated only, omitted = all")
            @RequestParam(required = false) Boolean active) {
        LocalDate today = service.today();
        return service.list(active).stream().map(v -> HabitMapper.toResponse(v, today)).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a habit")
    @ApiResponse(responseCode = "404", description = "Habit not found")
    public HabitResponse get(@PathVariable Long id) {
        return respond(service.get(id));
    }

    @PostMapping
    @Operation(summary = "Create a habit")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    public ResponseEntity<HabitResponse> create(@Valid @RequestBody HabitRequest req) {
        HabitResponse body = respond(service.create(req.name(), req.description(), req.frequency()));
        return ResponseEntity.created(URI.create("/api/v1/habits/" + body.id())).body(body);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a habit")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Habit not found")
    public HabitResponse update(@PathVariable Long id, @Valid @RequestBody HabitRequest req) {
        return respond(service.update(id, req.name(), req.description(), req.frequency()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a habit", description = "Hard delete; its completions are deleted too (D-25).")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "Habit not found")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a habit", description = "Hidden from today's lists but kept.")
    public HabitResponse deactivate(@PathVariable Long id) {
        return respond(service.setActive(id, false));
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a habit")
    public HabitResponse activate(@PathVariable Long id) {
        return respond(service.setActive(id, true));
    }

    @PostMapping("/{id}/completions")
    @Operation(summary = "Complete a habit", description = "For today, or for `date` (not in the future).")
    @ApiResponse(responseCode = "201", description = "Completion recorded")
    @ApiResponse(responseCode = "400", description = "Date in the future")
    @ApiResponse(responseCode = "404", description = "Habit not found")
    @ApiResponse(responseCode = "409", description = "Already completed on that date")
    public ResponseEntity<CompletionResponse> complete(@PathVariable Long id,
            @RequestBody(required = false) CompletionRequest req) {
        HabitCompletion c = service.complete(id, req == null ? null : req.date());
        return ResponseEntity.created(URI.create("/api/v1/habits/" + id + "/completions/" + c.getCompletionDate()))
                .body(HabitMapper.toResponse(c));
    }

    @DeleteMapping("/{id}/completions/today")
    @Operation(summary = "Un-complete a habit for today")
    @ApiResponse(responseCode = "204", description = "Removed")
    @ApiResponse(responseCode = "404", description = "Habit not found, or not completed today")
    public ResponseEntity<Void> uncompleteToday(@PathVariable Long id) {
        service.uncomplete(id, null);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/completions/{date}")
    @Operation(summary = "Remove a completion on a date")
    @ApiResponse(responseCode = "204", description = "Removed")
    @ApiResponse(responseCode = "404", description = "Habit not found, or not completed on that date")
    public ResponseEntity<Void> uncomplete(@PathVariable Long id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        service.uncomplete(id, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/completions")
    @Operation(summary = "List a habit's completions", description = "Newest first.")
    @ApiResponse(responseCode = "404", description = "Habit not found")
    public List<CompletionResponse> completions(@PathVariable Long id) {
        return service.completions(id).stream().map(HabitMapper::toResponse).toList();
    }

    private HabitResponse respond(HabitView view) {
        return HabitMapper.toResponse(view, service.today());
    }
}
