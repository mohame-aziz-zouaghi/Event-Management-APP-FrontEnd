import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CommentDTO {
  id: number;
  content: string;
  userId: number;
  eventId: number;
  createdAt: string;
  updatedAt:string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseUrl = 'http://localhost:8089/api/comments';

  constructor(private http: HttpClient) {}

 /** Get all comments */
  getAllComments(): Observable<CommentDTO[]> {
    return this.http.get<CommentDTO[]>(`${this.baseUrl}/all`);
  }

  /** Add a new comment */
  addComment(userId: number, eventId: number, content: string): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(`${this.baseUrl}/add/${userId}/${eventId}`, content);
  }

  /** Update an existing comment */
  updateComment(commentId: number, content: string): Observable<CommentDTO> {
    return this.http.put<CommentDTO>(`${this.baseUrl}/update/${commentId}`, content);
  }

  /** Delete a comment */
  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${commentId}`);
  }

  /** Get all comments for a specific event */
  getCommentsByEvent(eventId: number): Observable<CommentDTO[]> {
    return this.http.get<CommentDTO[]>(`${this.baseUrl}/event/${eventId}`);
  }

  /** Get all comments made by a user */
  getCommentsByUser(userId: number): Observable<CommentDTO[]> {
    return this.http.get<CommentDTO[]>(`${this.baseUrl}/user/${userId}`);
  }
}

