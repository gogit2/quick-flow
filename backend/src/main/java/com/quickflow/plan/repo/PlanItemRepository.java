package com.quickflow.plan.repo;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.plan.domain.PlanItem;

public interface PlanItemRepository extends JpaRepository<PlanItem, Long> {

    List<PlanItem> findByPlanIdOrderByPositionAscIdAsc(Long planId);

    List<PlanItem> findByPlanIdIn(Collection<Long> planIds);
}
