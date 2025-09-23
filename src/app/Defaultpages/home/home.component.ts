import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

interface Event {
  id: number;
  title: string;
  date: Date;
  image: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  upcomingEvents: Event[] = [];

  ngOnInit(): void {
    // Mock events - replace with API call
    this.upcomingEvents = [
      { id: 1, title: 'Tech Conference 2025', date: new Date('2025-10-10'), image: 'assets/event1.jpg' },
      { id: 2, title: 'Music Festival', date: new Date('2025-11-05'), image: 'assets/event2.jpg' },
      { id: 3, title: 'Startup Meetup', date: new Date('2025-12-12'), image: 'assets/event3.jpg' }
    ];
  }

    handleGetStarted(): void {
    if (this.authService.isLoggedIn()) {
      // User is logged in → redirect to /events
      this.router.navigate(['/events']);
    } else {
      // User is not logged in → redirect to /register
      this.router.navigate(['/register']);
    }
  }
}
