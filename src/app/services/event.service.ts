import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Event {
  showRejectInput?: boolean;
  target: HTMLInputElement;
  id?: number;
  title: string;
  description: string;
  location: string;
  capacity: number;
  startDate: string;   // ISO string
  endDate: string;     // ISO string
  organizerId: number;
  updatedAt?: string | null;
  reservations?: any[]; // you can define a Reservation interface later
  createAt: string;    // ISO string
    // Add this for display purpose
  organizerUsername?: string;
  ticketNumber:string;
  photoUrls?:string[];
  status:string;
  rejectionReason:string; 
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private baseUrl = 'http://localhost:8089/api/events'; // replace with your actual API URL

  constructor(private http: HttpClient) {}

  /** Add new event */
  addEvent(formData : FormData): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/add`, formData);
  }

  /** Get all events */
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.baseUrl}/all`);
  }

  /** Get single event by ID */
  getEventById(id: number | string): Observable<Event> {
    return this.http.get<Event>(`${this.baseUrl}/${id}`);
  }

  /** Update event by ID */
  updateEvent(id: number, formData : FormData ): Observable<Event> {
    return this.http.put<Event>(`${this.baseUrl}/update/${id}`, formData);
  }

  /** Delete event by ID */
  deleteEvent(id: number | string) {
    return this.http.delete(`${this.baseUrl}/${id}`,{responseType:'text'});
  }

  /** Get photos for an event */
getEventPhotos(eventId: number): Observable<string[]> {
  return this.http.get<string[]>(`${this.baseUrl}/event-photos/${eventId}`);
}

updateEventStatus(eventId: number, status: string, reason?: string) {
  const params: any = { status };
  if (reason) params.reason = reason;
  return this.http.put<Event>(`${this.baseUrl}/${eventId}/approve`, null, { params });
}
}
