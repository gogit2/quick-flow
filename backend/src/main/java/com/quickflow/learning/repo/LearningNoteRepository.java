package com.quickflow.learning.repo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quickflow.learning.domain.LearningNote;

public interface LearningNoteRepository extends JpaRepository<LearningNote, Long> {

    List<LearningNote> findByCardIdOrderByCreatedAtDescIdDesc(Long cardId);

    List<LearningNote> findByCardIdIn(Collection<Long> cardIds);

    Optional<LearningNote> findByIdAndCardId(Long id, Long cardId);
}
