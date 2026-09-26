package com.quickflow.learning.repo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.learning.domain.LearningMilestone;

public interface LearningMilestoneRepository extends JpaRepository<LearningMilestone, Long> {

    List<LearningMilestone> findByCardIdOrderByPositionAscIdAsc(Long cardId);

    List<LearningMilestone> findByCardIdIn(Collection<Long> cardIds);

    Optional<LearningMilestone> findByIdAndCardId(Long id, Long cardId);
}
