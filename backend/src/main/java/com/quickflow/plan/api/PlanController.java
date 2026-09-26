package com.quickflow.plan.api;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

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

import com.quickflow.plan.domain.PlanStatus;
import com.quickflow.plan.service.PlanService;

@RestController
@RequestMapping("/api/v1/plans")
@Tag(name = "Plans", description = "Todo plans built from tasks, habits and learning cards (FR-07, FR-08)")
public class PlanController {

    private final PlanService service;

    public PlanController(PlanService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List plans",
            description = "Sorted IN_PROGRESS, NOT_STARTED, COMPLETED; then priorityOrder (1 first), then start (D-41).")
    @ApiResponse(responseCode = "400", description = "Invalid status filter")
    public List<PlanResponse> list(
            @Parameter(description = "Only plans with this derived status") @RequestParam(required = false)
            PlanStatus status) {
        return service.list(status).stream().map(PlanMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a plan")
    @ApiResponse(responseCode = "404", description = "Plan not found")
    public PlanResponse get(@PathVariable Long id) {
        return PlanMapper.toResponse(service.get(id));
    }

    @PostMapping
    @Operation(summary = "Create a plan",
            description = "Needs ≥ 1 item referencing existing sources, no duplicates, end after start (BR-10, BR-11, D-42).")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Validation or business rule failed")
    public ResponseEntity<PlanResponse> create(@Valid @RequestBody PlanRequest req) {
        PlanResponse body = PlanMapper.toResponse(service.create(PlanMapper.toInput(req)));
        return ResponseEntity.created(URI.create("/api/v1/plans/" + body.id())).body(body);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a plan",
            description = "Replaces every field and the item list; kept sources keep their done flag. Status is recomputed.")
    @ApiResponse(responseCode = "400", description = "Validation or business rule failed")
    @ApiResponse(responseCode = "404", description = "Plan not found")
    public PlanResponse update(@PathVariable Long id, @Valid @RequestBody PlanRequest req) {
        return PlanMapper.toResponse(service.update(id, PlanMapper.toInput(req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a plan", description = "Hard delete of the plan and its items; sources are untouched.")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "Plan not found")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
