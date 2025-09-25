import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Reservation {
  id?: number;
  userId: number;
  eventId: number;
  reservationDate: string; // ISO string
  status: string;
  ticketNumber: string;
  username: string;
  eventtitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private baseUrl = 'http://localhost:8089/api/reservations';

  constructor(private http: HttpClient) {}

  /** Create a new reservation */
  createReservation(userId: number, eventId: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/create`, null, {
      params: { userId, eventId }
    });
  }

  /** Get all reservations by user ID */
  getReservationsByUser(userId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/user/${userId}`);
  }

  /** Get all reservations by event ID */
  getReservationsByEvent(eventId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/event/${eventId}`);
  }

  /** Search reservations by username */
  getReservationsByUsername(username: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/user/username/${username}`);
  }

  /** Search reservations by event title */
  getReservationsByEventTitle(title: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/event/title/${title}`);
  }

  /** Get all reservations */
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/all`);
  }

  /** Cancel a reservation */
  cancelReservation(id: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/cancel/${id}`, null, { responseType: 'text' });
  }
}
