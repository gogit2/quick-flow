/** Mirrors the `Plan*` schemas in openapi.json. */
export type PlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type PlanSourceType = 'TASK' | 'HABIT' | 'LEARNING_RESOURCE';

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};
export const PLAN_SOURCE_LABELS: Record<PlanSourceType, string> = {
  TASK: 'Task',
  HABIT: 'Habit',
  LEARNING_RESOURCE: 'Learning',
};
export const PLAN_SOURCE_ICONS: Record<PlanSourceType, string> = {
  TASK: 'check_circle',
  HABIT: 'repeat',
  LEARNING_RESOURCE: 'school',
};

/** Same limit as the backend validation. */
export const PLAN_TITLE_MAX = 200;

export interface PlanItemRequest {
  sourceType: PlanSourceType;
  sourceId: number;
}

export interface PlanRequest {
  title: string;
  /** Minutes, ≥ 1 (D-40). */
  estimatedDuration: number;
  /** ISO instants; end must be after start (BR-11). */
  startDateTime: string;
  endDateTime: string;
  /** ≥ 1, 1 = highest (D-41). */
  priorityOrder: number;
  /** At least one (BR-10). */
  items: PlanItemRequest[];
}

export interface PlanItemResponse {
  id: number;
  sourceType: PlanSourceType;
  sourceId: number;
  sourceTitle: string;
  /** See A-08 for the per-type values. */
  sourceStatus: string;
  done: boolean;
  position: number;
}

export interface PlanResponse {
  id: number;
  title: string;
  estimatedDuration: number;
  startDateTime: string;
  endDateTime: string;
  priorityOrder: number;
  status: PlanStatus;
  items: PlanItemResponse[];
  doneItems: number;
  totalItems: number;
  progressPercent: number;
  /** Only while IN_PROGRESS (BR-12). */
  remainingSeconds?: number | null;
  /** Only while NOT_STARTED (A-01). */
  startsInSeconds?: number | null;
  /** Server clock when the response was computed (D-44). */
  serverTime: string;
  createdAt: string;
}

export interface PlanItemDoneRequest {
  done: boolean;
}
