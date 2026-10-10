/** Mirrors `TaskRequest` / `TaskResponse` in openapi.json. */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskSort = 'createdAt' | 'dueDate';
export type SortDir = 'asc' | 'desc';

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

/** BR-1 / BR-2 limits, same as the backend validation. */
export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 2000;

export interface TaskRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** yyyy-MM-dd; null clears it on update. */
  dueDate?: string | null;
}

export interface TaskResponse {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  archived: boolean;
  overdue: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Query parameters of `GET /tasks`. */
export interface TaskQuery {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  dueFrom?: string;
  dueTo?: string;
  archived?: boolean;
  sort?: TaskSort;
  dir?: SortDir;
}
