import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8089/auth'; // adjust if needed

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
      })
    );
  }

register(user: { username: string; email: string; password: string }): Observable<string> {
  // Set responseType to 'text' to accept plain text from backend
  return this.http.post(`${this.baseUrl}/register`, user, { responseType: 'text' });
}


  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
