import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { EventService, Event as AppEvent } from 'src/app/services/event.service';  

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  upcomingEvents: AppEvent[] = [];
  backendUrl = 'http://localhost:8089'; // replace with your backend if needed


  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchUpcomingEvents();
  }

/** Fetch only approved & upcoming/ongoing events */
fetchUpcomingEvents(): void {
  this.eventService.getAllEvents().subscribe({
    next: (events: AppEvent[]) => {
      const now = new Date().getTime();

      this.upcomingEvents = events
        // 1️⃣ Only approved
        .filter((event: AppEvent) => event.status === 'APPROVED')
        // 2️⃣ Upcoming or ongoing but not full
        .filter((event: AppEvent) => {
          const start = new Date(event.startDate).getTime();
          const end = new Date(event.endDate).getTime();
          const full = this.isEventFull(event);

          return start > now || (now >= start && now < end && !full);
        })
        // 3️⃣ Sort with same order logic
        .sort((a, b) => this.getEventOrder(a) - this.getEventOrder(b))
        // 4️⃣ Show max 3
        .slice(0, 3);
    },
    error: (err) => {
      console.error('Failed to load upcoming events', err);
    }
  });
}


  /** Determine event order */
  private getEventOrder(event: AppEvent): number {
    const now = new Date().getTime();
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    const full = this.isEventFull(event);

    if (start > now && !full) return 0; // Upcoming + spots left
    if (start > now && full) return 1;  // Upcoming + full
    if (now >= start && now < end && !full) return 2; // Ongoing + not full
    if (now >= start && now < end && full) return 3;  // Ongoing + full
    return 4; // Ended
  }

  /** Handle Get Started button */
  handleGetStarted(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/events']);
    } else {
      this.router.navigate(['/register']);
    }
  }

  /** Calculate remaining spots */
  getRemainingSpots(event: AppEvent): number {
    return event.capacity - (event.reservations ? event.reservations.filter(r => r.status !== 'CANCELLED').length : 0);
  }

  /** Check if event is full */
  isEventFull(event: AppEvent): boolean {
    return this.getRemainingSpots(event) <= 0;
  }

  /** Check if event is ongoing */
  isEventStarted(event: AppEvent): boolean {
    const now = new Date().getTime();
    return new Date(event.startDate).getTime() <= now &&
           new Date(event.endDate).getTime() >= now;
  }

  /** Check if event is ended */
  isEventEnded(event: AppEvent): boolean {
    return new Date(event.endDate).getTime() < new Date().getTime();
  }

  /** Count only active reservations (not cancelled) */
getActiveReservations(event: AppEvent): number {
  if (!event.reservations) return 0;
  return event.reservations.filter(r => r.status !== 'CANCELLED').length;
}
}
