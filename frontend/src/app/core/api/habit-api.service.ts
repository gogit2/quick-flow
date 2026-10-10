import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompletionRequest, CompletionResponse, HabitRequest, HabitResponse } from '../models/habit';
import { API_BASE } from './api.config';

/** `Habits` tag of the contract. */
@Injectable({ providedIn: 'root' })
export class HabitApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/habits`;

  /** `active` omitted = all habits. */
  list(active?: boolean): Observable<HabitResponse[]> {
    const params = active === undefined ? new HttpParams() : new HttpParams().set('active', String(active));
    return this.http.get<HabitResponse[]>(this.base, { params });
  }

  get(id: number): Observable<HabitResponse> {
    return this.http.get<HabitResponse>(`${this.base}/${id}`);
  }

  create(body: HabitRequest): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(this.base, body);
  }

  update(id: number, body: HabitRequest): Observable<HabitResponse> {
    return this.http.put<HabitResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deactivate(id: number): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(`${this.base}/${id}/deactivate`, null);
  }

  activate(id: number): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(`${this.base}/${id}/activate`, null);
  }

  completions(id: number): Observable<CompletionResponse[]> {
    return this.http.get<CompletionResponse[]>(`${this.base}/${id}/completions`);
  }

  /** 409 when a completion already exists for that date (BR-7). */
  complete(id: number, body: CompletionRequest = {}): Observable<CompletionResponse> {
    return this.http.post<CompletionResponse>(`${this.base}/${id}/completions`, body);
  }

  uncompleteToday(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/completions/today`);
  }
}
