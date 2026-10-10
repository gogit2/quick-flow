/** Mirrors `HabitRequest` / `HabitResponse` / `CompletionRequest` / `CompletionResponse` in openapi.json. */
export type HabitFrequency = 'DAILY' | 'WEEKLY';

export const HABIT_FREQUENCIES: HabitFrequency[] = ['DAILY', 'WEEKLY'];
export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = { DAILY: 'Daily', WEEKLY: 'Weekly' };

/** BR-6 / A-05 limits, same as the backend validation. */
export const HABIT_NAME_MAX = 150;
export const HABIT_DESCRIPTION_MAX = 1000;

export interface HabitRequest {
  name: string;
  description?: string | null;
  frequency: HabitFrequency;
}

export interface HabitResponse {
  id: number;
  name: string;
  description?: string | null;
  frequency: HabitFrequency;
  active: boolean;
  /** A completion exists for today (any frequency). */
  doneToday: boolean;
  /** Daily: done today. Weekly: at least one completion this ISO week (D-21). */
  doneThisPeriod: boolean;
  currentStreak: number;
  progressPercent: number;
  lastCompletedDate?: string | null;
  createdAt: string;
}

export interface CompletionRequest {
  /** yyyy-MM-dd; omitted = today. */
  date?: string;
}

export interface CompletionResponse {
  id: number;
  habitId: number;
  date: string;
  createdAt: string;
}
