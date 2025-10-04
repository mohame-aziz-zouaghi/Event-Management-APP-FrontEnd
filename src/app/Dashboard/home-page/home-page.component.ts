import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent {
    constructor(private router: Router) {}

  logout() {
    // Clear token or session
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  goToSettings() {
    this.router.navigate(['/usersettings']);
  }
}
