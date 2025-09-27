import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id:number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  dateOfBirth: string; // ISO string
  genre: 'MASCULIN' | 'FEMININ' | 'OTHER';
  organizedEvents: any[]; // You can replace `any` with Event interface later
  reservations: any[]; // You can replace `any` with Reservation interface later
  profilePicture:string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8089/api/user'; // replace with your backend URL

  constructor(private http: HttpClient) { }

  /** Get all users */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/all`);
  }

  /** Get user by id */
  getUserByid(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  /** Add a new user */
  addUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/add`, user);
  }

  /** Update a user */
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/update/${id}`, user);
  }

  /** Delete a user */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
