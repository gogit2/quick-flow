import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanRequest, PlanResponse, PlanStatus } from '../models/plan';
import { API_BASE } from './api.config';

/** `Plans` tag of the contract. */
@Injectable({ providedIn: 'root' })
export class PlanApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/plans`;

  /** Sorted by the server: status group, priorityOrder, start (D-41). */
  list(status?: PlanStatus): Observable<PlanResponse[]> {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    return this.http.get<PlanResponse[]>(this.base, { params });
  }

  get(id: number): Observable<PlanResponse> {
    return this.http.get<PlanResponse>(`${this.base}/${id}`);
  }

  create(body: PlanRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(this.base, body);
  }

  update(id: number, body: PlanRequest): Observable<PlanResponse> {
    return this.http.put<PlanResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Returns the full plan (A-09). */
  setItemDone(id: number, itemId: number, done: boolean): Observable<PlanResponse> {
    return this.http.patch<PlanResponse>(`${this.base}/${id}/items/${itemId}`, { done });
  }

  /** COMPLETED plans, most recent end first (D-49). */
  history(): Observable<PlanResponse[]> {
    return this.http.get<PlanResponse[]>(`${this.base}/history`);
  }
}
