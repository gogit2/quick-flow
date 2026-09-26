package com.quickflow.plan.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.common.error.BusinessRuleException;
import com.quickflow.common.error.NotFoundException;
import com.quickflow.common.time.AppTime;
import com.quickflow.plan.domain.Plan;
import com.quickflow.plan.domain.PlanItem;
import com.quickflow.plan.domain.PlanRules;
import com.quickflow.plan.domain.PlanStatus;
import com.quickflow.plan.repo.PlanItemRepository;
import com.quickflow.plan.repo.PlanRepository;
import com.quickflow.plan.service.PlanSourceResolver.SourceInfo;
import com.quickflow.plan.service.PlanSourceResolver.SourceKey;

@Service
@Transactional
public class PlanService {

    /** What the caller writes: plan fields plus the ordered item sources. */
    public record PlanInput(String title, int estimatedDuration, Instant startDateTime, Instant endDateTime,
            int priorityOrder, List<SourceKey> items) {
    }

    /** A plan with its items (by position), their resolved sources, and the status derived at {@code now}. */
    public record PlanView(Plan plan, List<PlanItem> items, Map<SourceKey, SourceInfo> sources, PlanStatus status,
            Instant now) {
    }

    private static final Comparator<PlanItem> ITEM_ORDER =
            Comparator.comparingInt(PlanItem::getPosition).thenComparing(PlanItem::getId);
    private static final Comparator<PlanView> LIST_ORDER =
            Comparator.<PlanView>comparingInt(v -> PlanRules.groupRank(v.status()))
                    .thenComparingInt(v -> v.plan().getPriorityOrder())
                    .thenComparing(v -> v.plan().getStartDateTime())
                    .thenComparing(v -> v.plan().getId());

    private final PlanRepository plans;
    private final PlanItemRepository items;
    private final PlanSourceResolver resolver;
    private final PlanItemSideEffects sideEffects;
    private final AppTime time;

    public PlanService(PlanRepository plans, PlanItemRepository items, PlanSourceResolver resolver,
            PlanItemSideEffects sideEffects, AppTime time) {
        this.plans = plans;
        this.items = items;
        this.resolver = resolver;
        this.sideEffects = sideEffects;
        this.time = time;
    }

    /** D-41: IN_PROGRESS, NOT_STARTED, COMPLETED; then priorityOrder, then start. Optional status filter. */
    public List<PlanView> list(PlanStatus status) {
        List<Plan> found = plans.findAll();
        if (found.isEmpty()) {
            return List.of();
        }
        Map<Long, List<PlanItem>> itemsByPlan = items.findByPlanIdIn(found.stream().map(Plan::getId).toList())
                .stream().collect(Collectors.groupingBy(PlanItem::getPlanId));
        Map<SourceKey, SourceInfo> sources = resolver.resolve(itemsByPlan.values().stream()
                .flatMap(List::stream).map(PlanService::key).collect(Collectors.toSet()));
        Instant now = time.now();
        return found.stream()
                .map(p -> view(p, itemsByPlan.getOrDefault(p.getId(), List.of()).stream().sorted(ITEM_ORDER).toList(),
                        sources, now))
                .filter(v -> status == null || v.status() == status)
                .sorted(LIST_ORDER)
                .toList();
    }

    public PlanView get(Long id) {
        return view(find(id));
    }

    public PlanView create(PlanInput in) {
        validate(in);
        Plan plan = plans.save(new Plan(in.title().trim(), in.estimatedDuration(), in.startDateTime(),
                in.endDateTime(), in.priorityOrder(), time.now()));
        List<PlanItem> created = new ArrayList<>();
        for (int i = 0; i < in.items().size(); i++) {
            SourceKey k = in.items().get(i);
            created.add(new PlanItem(plan.getId(), k.type(), k.id(), false, i));
        }
        items.saveAllAndFlush(created);
        return view(plan);
    }

    /** Replaces every field and the item list; items whose source is kept keep their done flag. */
    public PlanView update(Long id, PlanInput in) {
        Plan plan = find(id);
        validate(in);
        plan.setTitle(in.title().trim());
        plan.setEstimatedDuration(in.estimatedDuration());
        plan.setStartDateTime(in.startDateTime());
        plan.setEndDateTime(in.endDateTime());
        plan.setPriorityOrder(in.priorityOrder());

        Map<SourceKey, PlanItem> existing = items.findByPlanIdOrderByPositionAscIdAsc(plan.getId()).stream()
                .collect(Collectors.toMap(PlanService::key, Function.identity()));
        Set<SourceKey> wanted = new HashSet<>(in.items());
        items.deleteAll(existing.values().stream().filter(it -> !wanted.contains(key(it))).toList());
        items.flush();
        List<PlanItem> toSave = new ArrayList<>();
        for (int i = 0; i < in.items().size(); i++) {
            SourceKey k = in.items().get(i);
            PlanItem it = existing.get(k);
            if (it == null) {
                it = new PlanItem(plan.getId(), k.type(), k.id(), false, i);
            } else {
                it.setPosition(i);
            }
            toSave.add(it);
        }
        items.saveAllAndFlush(toSave);
        return view(plan);
    }

    public void delete(Long id) {
        plans.delete(find(id)); // items cascade in the DB; sources are untouched (BR-14)
    }

    /** FR-08: mark one item done/not done; BR-13 side effects on done, never reverted (D-47). */
    public PlanView setItemDone(Long planId, Long itemId, boolean done) {
        Plan plan = find(planId);
        PlanItem item = items.findByIdAndPlanId(itemId, plan.getId())
                .orElseThrow(() -> new NotFoundException("Plan " + planId + " has no item " + itemId));
        item.setDone(done);
        items.saveAndFlush(item);
        sideEffects.apply(item, done);
        return view(plan);
    }

    /** D-49: COMPLETED plans (derived status), most recent end first. */
    public List<PlanView> history() {
        return list(PlanStatus.COMPLETED).stream()
                .sorted(Comparator.<PlanView, Instant>comparing(v -> v.plan().getEndDateTime()).reversed()
                        .thenComparing(v -> v.plan().getId(), Comparator.reverseOrder()))
                .toList();
    }

    private Plan find(Long id) {
        return plans.findById(id).orElseThrow(() -> NotFoundException.of("Plan", id));
    }

    /** BR-10, BR-11, D-42: at least one item, end after start, no duplicate, every source exists. */
    private void validate(PlanInput in) {
        PlanRules.validateWindow(in.startDateTime(), in.endDateTime());
        if (in.items() == null || in.items().isEmpty()) {
            throw new BusinessRuleException("items", "A plan must have at least one item");
        }
        Set<SourceKey> seen = new HashSet<>();
        for (SourceKey k : in.items()) {
            if (!seen.add(k)) {
                throw new BusinessRuleException("items", "Duplicate item: " + k.type() + " " + k.id());
            }
        }
        Map<SourceKey, SourceInfo> found = resolver.resolve(seen);
        List<String> missing = in.items().stream().filter(k -> !found.containsKey(k))
                .map(k -> k.type() + " " + k.id()).toList();
        if (!missing.isEmpty()) {
            throw new BusinessRuleException("items", "Unknown source(s): " + String.join(", ", missing));
        }
    }

    private PlanView view(Plan plan) {
        List<PlanItem> planItems = items.findByPlanIdOrderByPositionAscIdAsc(plan.getId());
        Map<SourceKey, SourceInfo> sources = resolver.resolve(
                planItems.stream().map(PlanService::key).collect(Collectors.toSet()));
        return view(plan, planItems, sources, time.now());
    }

    /** D-43: derive the status and refresh the persisted column (never trusted). */
    private static PlanView view(Plan plan, List<PlanItem> planItems, Map<SourceKey, SourceInfo> sources,
            Instant now) {
        int done = (int) planItems.stream().filter(PlanItem::isDone).count();
        PlanStatus status = PlanRules.status(plan.getStartDateTime(), plan.getEndDateTime(), done, planItems.size(),
                now);
        if (plan.getStatus() != status) {
            plan.setStatus(status);
        }
        return new PlanView(plan, planItems, sources, status, now);
    }

    private static SourceKey key(PlanItem it) {
        return new SourceKey(it.getSourceType(), it.getSourceId());
    }
}
