import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage = '';
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        const token = localStorage.getItem('token');

        if (token) {
          // Decode JWT payload
          const payload = JSON.parse(atob(token.split('.')[1]));
        const usernameFromToken = payload.sub; // get username from 'sub'
          const role = payload.role || 'Unknown'; // default role 'user'

          console.log(`Token: ${token}`);
          console.log(`Username: ${usernameFromToken}`);
          console.log(`Role: ${role}`);

          // Role-based redirect
          if (role.toLowerCase() === 'admin') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          // fallback redirect
          this.router.navigate(['/home']);
        }
      },
      error: err => {
        this.errorMessage = 'Invalid credentials!';
        console.error(err);
      }
    });
  }

  
  togglePassword() {
  this.showPassword = !this.showPassword;
}
}
