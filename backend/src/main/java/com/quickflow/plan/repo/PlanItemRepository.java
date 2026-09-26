package com.quickflow.plan.repo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.quickflow.plan.domain.PlanItem;
import com.quickflow.plan.domain.PlanSourceType;

public interface PlanItemRepository extends JpaRepository<PlanItem, Long> {

    List<PlanItem> findByPlanIdOrderByPositionAscIdAsc(Long planId);

    List<PlanItem> findByPlanIdIn(Collection<Long> planIds);

    Optional<PlanItem> findByIdAndPlanId(Long id, Long planId);

    /** D-48 / BR-14: remove every plan item that references a deleted source. */
    @Modifying(flushAutomatically = true)
    @Query("delete from PlanItem i where i.sourceType = :type and i.sourceId = :sourceId")
    int deleteBySource(@Param("type") PlanSourceType type, @Param("sourceId") Long sourceId);
}
