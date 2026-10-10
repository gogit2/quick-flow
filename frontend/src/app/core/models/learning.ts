/** Mirrors the `LearningCard*`, `Milestone*` and `Note*` schemas in openapi.json. */
export type LearningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const LEARNING_STATUSES: LearningStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
export const LEARNING_STATUS_LABELS: Record<LearningStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

/** BR-8 / A-07 limits, same as the backend validation. */
export const LEARNING_TITLE_MAX = 200;
export const LEARNING_DESCRIPTION_MAX = 2000;
export const MILESTONE_TITLE_MAX = 200;
export const NOTE_TEXT_MAX = 5000;

export interface LearningCardRequest {
  title: string;
  description?: string | null;
  /** Ignored on create (A-07); on update, omitted = keep. */
  status?: LearningStatus;
}

export interface MilestoneResponse {
  id: number;
  cardId: number;
  title: string;
  done: boolean;
  targetDate?: string | null;
  completedAt?: string | null;
  position: number;
}

export interface NoteResponse {
  id: number;
  cardId: number;
  text: string;
  createdAt: string;
}

export interface LearningCardResponse {
  id: number;
  title: string;
  description?: string | null;
  status: LearningStatus;
  milestones: MilestoneResponse[];
  notes: NoteResponse[];
  milestonesDone: number;
  milestonesTotal: number;
  progressPercent: number;
  createdAt: string;
}

export interface MilestoneRequest {
  title: string;
  /** yyyy-MM-dd, optional. */
  targetDate?: string | null;
  done?: boolean;
}

export interface NoteRequest {
  text: string;
}
