import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SettingsRequest, SettingsResponse } from '../models/settings';
import { API_BASE } from './api.config';

/** `Settings` tag of the contract (single row, D-01). */
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/settings`;

  get(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(this.base);
  }

  update(body: SettingsRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(this.base, body);
  }
}
