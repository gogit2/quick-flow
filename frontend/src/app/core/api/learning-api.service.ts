import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LearningCardRequest, LearningCardResponse, MilestoneRequest, NoteRequest, NoteResponse } from '../models/learning';
import { API_BASE } from './api.config';

/** `Learning cards` tag of the contract (A-03: path `/learning-cards`). */
@Injectable({ providedIn: 'root' })
export class LearningApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/learning-cards`;

  list(): Observable<LearningCardResponse[]> {
    return this.http.get<LearningCardResponse[]>(this.base);
  }

  get(id: number): Observable<LearningCardResponse> {
    return this.http.get<LearningCardResponse>(`${this.base}/${id}`);
  }

  create(body: LearningCardRequest): Observable<LearningCardResponse> {
    return this.http.post<LearningCardResponse>(this.base, body);
  }

  update(id: number, body: LearningCardRequest): Observable<LearningCardResponse> {
    return this.http.put<LearningCardResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Returns the updated card (A-07). */
  addMilestone(cardId: number, body: MilestoneRequest): Observable<LearningCardResponse> {
    return this.http.post<LearningCardResponse>(`${this.base}/${cardId}/milestones`, body);
  }

  completeMilestone(cardId: number, milestoneId: number): Observable<LearningCardResponse> {
    return this.http.post<LearningCardResponse>(`${this.base}/${cardId}/milestones/${milestoneId}/complete`, null);
  }

  uncompleteMilestone(cardId: number, milestoneId: number): Observable<LearningCardResponse> {
    return this.http.post<LearningCardResponse>(`${this.base}/${cardId}/milestones/${milestoneId}/uncomplete`, null);
  }

  deleteMilestone(cardId: number, milestoneId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${cardId}/milestones/${milestoneId}`);
  }

  addNote(cardId: number, body: NoteRequest): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(`${this.base}/${cardId}/notes`, body);
  }

  deleteNote(cardId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${cardId}/notes/${noteId}`);
  }
}
