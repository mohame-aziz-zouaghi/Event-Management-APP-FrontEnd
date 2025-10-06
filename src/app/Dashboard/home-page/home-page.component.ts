import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
})
export class HomePageComponent {
  username: string = '';
  activePage: string = ''; // track which page is currently active

  constructor(private router: Router, private authService: AuthService) {}

  logout() {
    // Clear token or session
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  goToSettings() {
    this.router.navigate(['/usersettings']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.sub || 'User'; // ✅ Extract username
      } catch (e) {
        this.username = 'User';
      }
    }
  }

  // Set which page to display
  navigateTo(page: string) {
    this.activePage = page;
  }
}
