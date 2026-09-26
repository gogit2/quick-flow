package com.quickflow.learning.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.common.error.NotFoundException;
import com.quickflow.common.time.AppTime;
import com.quickflow.learning.domain.LearningCard;
import com.quickflow.learning.domain.LearningMilestone;
import com.quickflow.learning.domain.LearningNote;
import com.quickflow.learning.domain.LearningRules;
import com.quickflow.learning.domain.LearningStatus;
import com.quickflow.learning.repo.LearningCardRepository;
import com.quickflow.learning.repo.LearningMilestoneRepository;
import com.quickflow.learning.repo.LearningNoteRepository;

@Service
@Transactional
public class LearningService {

    /** A card with its milestones (by position) and notes (newest first). */
    public record CardView(LearningCard card, List<LearningMilestone> milestones, List<LearningNote> notes) {
    }

    private static final Comparator<LearningMilestone> MILESTONE_ORDER =
            Comparator.comparingInt(LearningMilestone::getPosition).thenComparing(LearningMilestone::getId);
    private static final Comparator<LearningNote> NOTE_ORDER =
            Comparator.comparing(LearningNote::getCreatedAt).thenComparing(LearningNote::getId).reversed();

    private final LearningCardRepository cards;
    private final LearningMilestoneRepository milestones;
    private final LearningNoteRepository notes;
    private final AppTime time;

    public LearningService(LearningCardRepository cards, LearningMilestoneRepository milestones,
            LearningNoteRepository notes, AppTime time) {
        this.cards = cards;
        this.milestones = milestones;
        this.notes = notes;
        this.time = time;
    }

    @Transactional(readOnly = true)
    public List<CardView> list() {
        List<LearningCard> found = cards.findAllByOrderByIdAsc();
        if (found.isEmpty()) {
            return List.of();
        }
        List<Long> ids = found.stream().map(LearningCard::getId).toList();
        Map<Long, List<LearningMilestone>> msByCard = milestones.findByCardIdIn(ids).stream()
                .collect(Collectors.groupingBy(LearningMilestone::getCardId));
        Map<Long, List<LearningNote>> notesByCard = notes.findByCardIdIn(ids).stream()
                .collect(Collectors.groupingBy(LearningNote::getCardId));
        return found.stream()
                .map(c -> new CardView(c,
                        msByCard.getOrDefault(c.getId(), List.of()).stream().sorted(MILESTONE_ORDER).toList(),
                        notesByCard.getOrDefault(c.getId(), List.of()).stream().sorted(NOTE_ORDER).toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CardView get(Long id) {
        return view(find(id));
    }

    public CardView create(String title, String description) {
        LearningCard card = cards.save(new LearningCard(title.trim(), description, time.now()));
        return new CardView(card, List.of(), List.of());
    }

    /** Replaces title and description. A given {@code status} is a manual override (D-31); null keeps it. */
    public CardView update(Long id, String title, String description, LearningStatus status) {
        LearningCard card = find(id);
        card.setTitle(title.trim());
        card.setDescription(description);
        if (status != null) {
            card.setStatus(status);
        }
        return view(card);
    }

    public void delete(Long id) {
        cards.delete(find(id)); // milestones and notes cascade in the DB (D-32)
    }

    public CardView addMilestone(Long cardId, String title, LocalDate targetDate) {
        LearningCard card = find(cardId);
        int next = milestones.findByCardIdOrderByPositionAscIdAsc(card.getId()).stream()
                .mapToInt(LearningMilestone::getPosition).max().orElse(-1) + 1;
        milestones.saveAndFlush(new LearningMilestone(card.getId(), title.trim(), targetDate, next));
        return rederive(card);
    }

    /** Replaces title and targetDate (null clears it). A given {@code done} marks/un-marks (D-30). */
    public CardView updateMilestone(Long cardId, Long milestoneId, String title, LocalDate targetDate, Boolean done) {
        LearningCard card = find(cardId);
        LearningMilestone m = findMilestone(card, milestoneId);
        m.setTitle(title.trim());
        m.setTargetDate(targetDate);
        if (done != null) {
            LearningRules.markMilestone(m, done, time.now());
        }
        milestones.flush();
        return rederive(card);
    }

    public CardView setMilestoneDone(Long cardId, Long milestoneId, boolean done) {
        LearningCard card = find(cardId);
        LearningRules.markMilestone(findMilestone(card, milestoneId), done, time.now());
        milestones.flush();
        return rederive(card);
    }

    public CardView removeMilestone(Long cardId, Long milestoneId) {
        LearningCard card = find(cardId);
        milestones.delete(findMilestone(card, milestoneId));
        milestones.flush();
        return rederive(card);
    }

    public LearningNote addNote(Long cardId, String text) {
        LearningCard card = find(cardId);
        return notes.save(new LearningNote(card.getId(), text.trim(), time.now()));
    }

    public void removeNote(Long cardId, Long noteId) {
        LearningCard card = find(cardId);
        LearningNote note = notes.findByIdAndCardId(noteId, card.getId())
                .orElseThrow(() -> new NotFoundException("Note " + noteId + " not found on learning card " + cardId));
        notes.delete(note);
    }

    private LearningCard find(Long id) {
        return cards.findById(id).orElseThrow(() -> NotFoundException.of("Learning card", id));
    }

    /** BR-9: a milestone id that belongs to another card is not found. */
    private LearningMilestone findMilestone(LearningCard card, Long milestoneId) {
        return milestones.findByIdAndCardId(milestoneId, card.getId())
                .orElseThrow(() -> new NotFoundException(
                        "Milestone " + milestoneId + " not found on learning card " + card.getId()));
    }

    /** D-31: any milestone change re-derives the card status, overriding a manual one. */
    private CardView rederive(LearningCard card) {
        CardView v = view(card);
        card.setStatus(LearningRules.deriveStatus(v.milestones()));
        return v;
    }

    private CardView view(LearningCard card) {
        return new CardView(card,
                milestones.findByCardIdOrderByPositionAscIdAsc(card.getId()),
                notes.findByCardIdOrderByCreatedAtDescIdDesc(card.getId()));
    }
}
