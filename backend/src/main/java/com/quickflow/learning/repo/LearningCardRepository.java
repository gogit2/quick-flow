package com.quickflow.learning.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.learning.domain.LearningCard;

public interface LearningCardRepository extends JpaRepository<LearningCard, Long> {

    List<LearningCard> findAllByOrderByIdAsc();
}
