import { HabitResponse } from './habit';
import { LearningStatus } from './learning';
import { PlanResponse } from './plan';
import { TaskResponse } from './task';

/** Mirrors `DashboardResponse` and the nested `Dashboard*` schemas in openapi.json (D-50). */
export interface DashboardTasks {
  dueToday: TaskResponse[];
  overdue: TaskResponse[];
  completedToday: TaskResponse[];
  /** Non-archived DONE tasks. */
  doneCount: number;
  /** All non-archived tasks. */
  totalActive: number;
  /** doneCount ÷ totalActive, rounded, 0–100 (D-15). */
  completionPercent: number;
}

export interface DashboardHabits {
  activeCount: number;
  completedTodayCount: number;
  /** Active daily habits plus active weekly habits not done this week (D-24). */
  today: HabitResponse[];
}

export interface DashboardPlans {
  activeCount: number;
  /** IN_PROGRESS plans with progress and remainingSeconds. */
  active: PlanResponse[];
  /** Next NOT_STARTED plans by start (max 5). */
  upcoming: PlanResponse[];
}

export interface DashboardCard {
  id: number;
  title: string;
  milestonesDone: number;
  milestonesTotal: number;
  progressPercent: number;
}

export interface DashboardLearning {
  /** Every status is present (A-10). */
  byStatus: Record<LearningStatus, number>;
  inProgress: DashboardCard[];
  milestonesCompletedLast7Days: number;
}

export interface DashboardResponse {
  /** "Good morning/afternoon/evening, {displayName}" in the app zone (D-52, A-02). */
  greeting: string;
  displayName: string;
  /** Today in the app zone (yyyy-MM-dd). */
  today: string;
  serverTime: string;
  tasks: DashboardTasks;
  habits: DashboardHabits;
  plans: DashboardPlans;
  learning: DashboardLearning;
}
