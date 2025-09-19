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
        this.router.navigate(['/dashboard']);
       console.log("Token : " + localStorage.getItem('token') + "\n" + "Username : "+ this.username);// redirect after login
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
