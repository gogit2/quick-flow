package com.quickflow.learning.api;

import java.util.List;

import com.quickflow.learning.domain.LearningCard;
import com.quickflow.learning.domain.LearningMilestone;
import com.quickflow.learning.domain.LearningNote;
import com.quickflow.learning.domain.LearningRules;
import com.quickflow.learning.service.LearningService.CardView;

final class LearningMapper {

    private LearningMapper() {
    }

    static LearningCardResponse toResponse(CardView view) {
        LearningCard c = view.card();
        List<LearningMilestone> ms = view.milestones();
        return new LearningCardResponse(
                c.getId(), c.getTitle(), c.getDescription(), c.getStatus(), c.getCreatedAt(),
                ms.stream().map(LearningMapper::toResponse).toList(),
                view.notes().stream().map(LearningMapper::toResponse).toList(),
                ms.size(),
                LearningRules.countDone(ms),
                LearningRules.progressPercent(ms));
    }

    static MilestoneResponse toResponse(LearningMilestone m) {
        return new MilestoneResponse(m.getId(), m.getCardId(), m.getTitle(), m.isDone(), m.getTargetDate(),
                m.getCompletedAt(), m.getPosition());
    }

    static NoteResponse toResponse(LearningNote n) {
        return new NoteResponse(n.getId(), n.getCardId(), n.getText(), n.getCreatedAt());
    }
}
