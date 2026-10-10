import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResponse } from '../models/dashboard';
import { API_BASE } from './api.config';

/** `Dashboard` tag of the contract: all widgets in one payload (D-50). */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  get(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${API_BASE}/dashboard`);
  }
}
