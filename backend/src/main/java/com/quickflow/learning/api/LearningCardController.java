package com.quickflow.learning.api;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.quickflow.learning.domain.LearningMilestone;
import com.quickflow.learning.domain.LearningNote;
import com.quickflow.learning.service.LearningService;
import com.quickflow.learning.service.LearningService.CardView;

@RestController
@RequestMapping("/api/v1/learning-cards")
@Tag(name = "Learning", description = "Learning cards with milestones and notes (FR-05, FR-06)")
public class LearningCardController {

    private static final String BASE = "/api/v1/learning-cards/";

    private final LearningService service;

    public LearningCardController(LearningService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List learning cards", description = "All cards by id, each with milestones and notes.")
    public List<LearningCardResponse> list() {
        return service.list().stream().map(LearningMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a learning card")
    @ApiResponse(responseCode = "404", description = "Card not found")
    public LearningCardResponse get(@PathVariable Long id) {
        return LearningMapper.toResponse(service.get(id));
    }

    @PostMapping
    @Operation(summary = "Create a learning card", description = "Starts NOT_STARTED; `status` in the body is ignored.")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    public ResponseEntity<LearningCardResponse> create(@Valid @RequestBody LearningCardRequest req) {
        LearningCardResponse body = LearningMapper.toResponse(service.create(req.title(), req.description()));
        return ResponseEntity.created(URI.create(BASE + body.id())).body(body);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a learning card",
            description = "Replaces title and description. An optional `status` sets it manually (D-31).")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Card not found")
    public LearningCardResponse update(@PathVariable Long id, @Valid @RequestBody LearningCardRequest req) {
        return LearningMapper.toResponse(service.update(id, req.title(), req.description(), req.status()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a learning card", description = "Hard delete; its milestones and notes too (D-32).")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "Card not found")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/milestones")
    @Operation(summary = "Add a milestone", description = "Appended last. Returns the updated card (status re-derived).")
    @ApiResponse(responseCode = "201", description = "Added; body is the updated card")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Card not found")
    public ResponseEntity<LearningCardResponse> addMilestone(@PathVariable Long id,
            @Valid @RequestBody MilestoneRequest req) {
        CardView view = service.addMilestone(id, req.title(), req.targetDate());
        List<LearningMilestone> ms = view.milestones();
        Long mid = ms.get(ms.size() - 1).getId();
        return ResponseEntity.created(URI.create(BASE + id + "/milestones/" + mid))
                .body(LearningMapper.toResponse(view));
    }

    @PutMapping("/{id}/milestones/{milestoneId}")
    @Operation(summary = "Update a milestone",
            description = "Replaces title and targetDate; optional `done` marks it. Returns the updated card.")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Card not found, or milestone not on this card")
    public LearningCardResponse updateMilestone(@PathVariable Long id, @PathVariable Long milestoneId,
            @Valid @RequestBody MilestoneRequest req) {
        return LearningMapper.toResponse(
                service.updateMilestone(id, milestoneId, req.title(), req.targetDate(), req.done()));
    }

    @PostMapping("/{id}/milestones/{milestoneId}/complete")
    @Operation(summary = "Complete a milestone", description = "Sets `completedAt`. Returns the updated card.")
    @ApiResponse(responseCode = "404", description = "Card not found, or milestone not on this card")
    public LearningCardResponse completeMilestone(@PathVariable Long id, @PathVariable Long milestoneId) {
        return LearningMapper.toResponse(service.setMilestoneDone(id, milestoneId, true));
    }

    @PostMapping("/{id}/milestones/{milestoneId}/uncomplete")
    @Operation(summary = "Un-complete a milestone", description = "Clears `completedAt`. Returns the updated card.")
    @ApiResponse(responseCode = "404", description = "Card not found, or milestone not on this card")
    public LearningCardResponse uncompleteMilestone(@PathVariable Long id, @PathVariable Long milestoneId) {
        return LearningMapper.toResponse(service.setMilestoneDone(id, milestoneId, false));
    }

    @DeleteMapping("/{id}/milestones/{milestoneId}")
    @Operation(summary = "Remove a milestone", description = "The card status is re-derived.")
    @ApiResponse(responseCode = "204", description = "Removed")
    @ApiResponse(responseCode = "404", description = "Card not found, or milestone not on this card")
    public ResponseEntity<Void> removeMilestone(@PathVariable Long id, @PathVariable Long milestoneId) {
        service.removeMilestone(id, milestoneId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add a note")
    @ApiResponse(responseCode = "201", description = "Added")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Card not found")
    public ResponseEntity<NoteResponse> addNote(@PathVariable Long id, @Valid @RequestBody NoteRequest req) {
        LearningNote note = service.addNote(id, req.text());
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create(BASE + id + "/notes/" + note.getId()))
                .body(LearningMapper.toResponse(note));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    @Operation(summary = "Remove a note")
    @ApiResponse(responseCode = "204", description = "Removed")
    @ApiResponse(responseCode = "404", description = "Card not found, or note not on this card")
    public ResponseEntity<Void> removeNote(@PathVariable Long id, @PathVariable Long noteId) {
        service.removeNote(id, noteId);
        return ResponseEntity.noContent().build();
    }
}
