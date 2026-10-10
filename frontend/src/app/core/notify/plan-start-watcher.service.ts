import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { PlanApi } from '../api/plan-api.service';
import { NowService } from '../time/now.service';
import { NotificationService } from './notification.service';

const STORAGE_KEY = 'qf.notifiedPlans';
const POLL_MS = 30_000;

interface Upcoming {
  id: number;
  title: string;
  /** Start in client-clock milliseconds (server start corrected by the server/client skew). */
  startAt: number;
}

/**
 * Notifies when a plan's start time is reached (D-46, US-PLAN-07).
 * Polls `GET /plans?status=NOT_STARTED` every 30 s, checks the start times on every NowService tick,
 * and remembers notified plan ids in localStorage so a reload does not repeat the notification.
 * Started once from the app shell, so it works on every page.
 */
@Injectable({ providedIn: 'root' })
export class PlanStartWatcher {
  private readonly api = inject(PlanApi);
  private readonly clock = inject(NowService);
  private readonly notify = inject(NotificationService);

  private readonly upcoming = signal<Upcoming[]>([]);
  /** Plans that started during this session; plan cards highlight them. */
  readonly started = signal<ReadonlySet<number>>(new Set());
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const now = this.clock.now();
      const due = this.upcoming().filter((p) => p.startAt <= now);
      if (due.length) untracked(() => this.fire(due));
    });
  }

  /** Starts polling (idempotent). */
  start(): void {
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), POLL_MS);
  }

  /** Re-reads the upcoming plans now, e.g. right after a plan is created or edited. */
  refresh(): void {
    const sentAt = Date.now();
    this.api.list('NOT_STARTED').subscribe({
      next: (plans) => {
        const notified = readNotified();
        this.upcoming.set(
          plans
            .filter((p) => !notified.has(p.id))
            .map((p) => {
              // startsInSeconds is relative to the server's "now" (A-01): anchor it to the request time.
              const startAt = p.startsInSeconds != null ? sentAt + p.startsInSeconds * 1000 : Date.parse(p.startDateTime);
              return { id: p.id, title: p.title, startAt };
            }),
        );
      },
      error: () => {
        /* keep the last known list; the next poll retries */
      },
    });
  }

  private fire(due: Upcoming[]): void {
    const notified = readNotified();
    const ids = new Set(due.map((p) => p.id));
    this.upcoming.update((list) => list.filter((p) => !ids.has(p.id)));
    for (const p of due) {
      if (notified.has(p.id)) continue;
      notified.add(p.id);
      this.notify.remind(`Plan '${p.title}' has started`);
    }
    writeNotified(notified);
    this.started.update((s) => new Set([...s, ...ids]));
  }
}

function readNotified(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(ids) ? ids.filter((x): x is number => typeof x === 'number') : []);
  } catch {
    return new Set();
  }
}

function writeNotified(ids: Set<number>): void {
  try {
    // Keep the list bounded: the newest 500 ids are plenty to avoid repeats.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* storage unavailable: worst case a reload repeats the notification */
  }
}
