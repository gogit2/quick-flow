import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskQuery, TaskRequest, TaskResponse } from '../models/task';
import { API_BASE } from './api.config';

/** `Tasks` tag of the contract. */
@Injectable({ providedIn: 'root' })
export class TaskApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/tasks`;

  list(query: TaskQuery = {}): Observable<TaskResponse[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<TaskResponse[]>(this.base, { params });
  }

  get(id: number): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.base}/${id}`);
  }

  create(body: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.base, body);
  }

  update(id: number, body: TaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.base}/${id}`, body);
  }

  complete(id: number): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/complete`, null);
  }

  archive(id: number): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/archive`, null);
  }

  restore(id: number): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/restore`, null);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
