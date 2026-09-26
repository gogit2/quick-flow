package com.quickflow.plan.api;

import java.util.List;

import com.quickflow.plan.domain.Plan;
import com.quickflow.plan.domain.PlanItem;
import com.quickflow.plan.domain.PlanRules;
import com.quickflow.plan.service.PlanService.PlanInput;
import com.quickflow.plan.service.PlanService.PlanView;
import com.quickflow.plan.service.PlanSourceResolver.SourceInfo;
import com.quickflow.plan.service.PlanSourceResolver.SourceKey;

public final class PlanMapper {

    private PlanMapper() {
    }

    static PlanInput toInput(PlanRequest req) {
        return new PlanInput(req.title(), req.estimatedDuration(), req.startDateTime(), req.endDateTime(),
                req.priorityOrder(),
                req.items().stream().map(i -> new SourceKey(i.sourceType(), i.sourceId())).toList());
    }

    public static PlanResponse toResponse(PlanView view) {
        Plan p = view.plan();
        List<PlanItem> items = view.items();
        int done = (int) items.stream().filter(PlanItem::isDone).count();
        return new PlanResponse(
                p.getId(), p.getTitle(), p.getEstimatedDuration(), p.getStartDateTime(), p.getEndDateTime(),
                p.getPriorityOrder(), view.status(), p.getCreatedAt(),
                items.stream().map(i -> toResponse(i, view)).toList(),
                done, items.size(),
                PlanRules.progressPercent(done, items.size()),
                PlanRules.remainingSeconds(view.status(), p.getEndDateTime(), view.now()),
                PlanRules.startsInSeconds(view.status(), p.getStartDateTime(), view.now()),
                view.now());
    }

    private static PlanItemResponse toResponse(PlanItem i, PlanView view) {
        SourceInfo src = view.sources().get(new SourceKey(i.getSourceType(), i.getSourceId()));
        return new PlanItemResponse(i.getId(), i.getSourceType(), i.getSourceId(),
                src == null ? null : src.title(), src == null ? null : src.status(), i.isDone(), i.getPosition());
    }
}
