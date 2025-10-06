// src/app/services/calendar.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalendarEvent {
  reservationId: number;
  eventId: number;
  eventTitle: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private baseUrl = 'http://localhost:8089/api/reservations';

  constructor(private http: HttpClient) {}

  getUserCalendar(userId: number): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.baseUrl}/calendar/${userId}`);
  }
}
