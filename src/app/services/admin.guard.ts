import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // 1. Check if logged in
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/unauthorized']);  // not logged in → no access
      return false;
    }

    // 2. Get token
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    // 3. Decode token to extract role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || 'Unknown';

      if (role === 'ADMIN') {
        return true; // ✅ Admin can access
      } else {
        this.router.navigate(['/unauthorized']); // ❌ Not admin
        return false;
      }
    } catch (e) {
      this.router.navigate(['/unauthorized']); // ❌ Bad token
      return false;
    }
  }
}
