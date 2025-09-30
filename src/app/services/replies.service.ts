import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReplyDTO {
  id: number;
  content: string;
  commentId: number;
  userId: number;
  createdAt: string;
  updatedAt:string
}

@Injectable({
  providedIn: 'root'
})
export class ReplyService {
  private baseUrl = 'http://localhost:8089/api/replies';

  constructor(private http: HttpClient) {}

  /** Add a reply to a comment */
  addReply(userId: number, commentId: number, content: string): Observable<ReplyDTO> {
    return this.http.post<ReplyDTO>(`${this.baseUrl}/add/${userId}/${commentId}`, content);
  }

  /** Update an existing reply */
  updateReply(replyId: number, content: string): Observable<ReplyDTO> {
    return this.http.put<ReplyDTO>(`${this.baseUrl}/update/${replyId}`, content);
  }

  /** Delete a reply */
  deleteReply(replyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${replyId}`);
  }

  /** Get all replies for a specific comment */
  getRepliesByComment(commentId: number): Observable<ReplyDTO[]> {
    return this.http.get<ReplyDTO[]>(`${this.baseUrl}/comment/${commentId}`);
  }

  /** Get all replies made by a user */
  getRepliesByUser(userId: number): Observable<ReplyDTO[]> {
    return this.http.get<ReplyDTO[]>(`${this.baseUrl}/user/${userId}`);
  }
}
