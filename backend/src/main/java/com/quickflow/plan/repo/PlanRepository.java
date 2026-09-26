package com.quickflow.plan.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.plan.domain.Plan;

public interface PlanRepository extends JpaRepository<Plan, Long> {
}
