import { Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import { NowService } from '../../core/time/now.service';

/** `HH:MM:SS`, or `Xd HH:MM:SS` above 24 h (D-45). Negative input is clamped to 0. */
export function formatRestTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86_400);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hms = `${pad(Math.floor((s % 86_400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return days > 0 ? `${days}d ${hms}` : hms;
}

export type RestTimePhase = 'before' | 'during' | 'after';

/**
 * Live "rest time" of a time window, ticking every second from the shared NowService (D-45).
 * Shown only while start ≤ now < end (BR-12), using the server clock (`now + skewMs`, D-44).
 * Emits `phaseChange` when the window starts or ends, so the owner can re-fetch the derived status (D-43).
 */
@Component({
  selector: 'app-rest-time',
  template: `
    @if (visible()) {
      <span class="rest-time" [attr.data-testid]="testid()" [attr.aria-label]="'Time remaining ' + text()" role="timer">{{ text() }}</span>
    }
  `,
  styles: `
    .rest-time { font-variant-numeric: tabular-nums; font-weight: 500; }
  `,
})
export class RestTimeComponent {
  private readonly clock = inject(NowService);

  readonly start = input.required<string>();
  readonly end = input.required<string>();
  /** serverTime − client time when the data was received. */
  readonly skewMs = input(0);
  /** Set false to hide it regardless of time (e.g. a plan completed early by its items). */
  readonly enabled = input(true);
  readonly testid = input('rest-time');
  readonly phaseChange = output<RestTimePhase>();

  private readonly serverNow = computed(() => this.clock.now() + this.skewMs());
  private readonly startMs = computed(() => Date.parse(this.start()));
  private readonly endMs = computed(() => Date.parse(this.end()));

  readonly phase = computed<RestTimePhase>(() => {
    const now = this.serverNow();
    return now < this.startMs() ? 'before' : now < this.endMs() ? 'during' : 'after';
  });
  readonly visible = computed(() => this.enabled() && this.phase() === 'during');
  readonly text = computed(() => formatRestTime(Math.ceil((this.endMs() - this.serverNow()) / 1000)));

  constructor() {
    let last: RestTimePhase | undefined;
    effect(() => {
      const p = this.phase();
      if (last !== undefined && p !== last) untracked(() => this.phaseChange.emit(p));
      last = p;
    });
  }
}
