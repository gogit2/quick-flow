import { Injectable, OnDestroy, signal } from '@angular/core';

/** A shared `now` signal ticking every second; used by every countdown (D-45). */
@Injectable({ providedIn: 'root' })
export class NowService implements OnDestroy {
  private readonly _now = signal(Date.now());
  readonly now = this._now.asReadonly();
  private readonly timer = setInterval(() => this._now.set(Date.now()), 1000);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
