import { Component, OnInit } from '@angular/core';
import { EventService, Event } from '../../services/event.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {

  events: Event[] = [];
  loading: boolean = false;
  error: string = '';
    refreshSubscription!: Subscription; // for polling


  constructor(private eventService: EventService, private userService: UserService) {}

  ngOnInit(): void {
    this.fetchEvents();

    // Polling every 5 seconds for real-time updates
    this.refreshSubscription = interval(500000).subscribe(() => {
      this.fetchEvents();
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }


  fetchEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loadOrganizersUsernames();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load events. Please try again later.';
        this.loading = false;
      }
    });
  }

  /** Load organizer usernames for each event */
  loadOrganizersUsernames(): void {
    const observables = this.events.map(event =>
      this.userService.getUserByid(event.organizerId)
    );

    forkJoin(observables).subscribe({
      next: (users) => {
        users.forEach((user, index) => {
          this.events[index].organizerUsername = `${user.username}`;
        });
      },
      error: (err) => console.error('Error fetching organizers:', err)
    });
  }


  /** Helper: calculate time since creation */
  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const created = new Date(dateStr);
    const diff = now.getTime() - created.getTime(); // difference in ms

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  /** Calculate remaining spots for an event */
getRemainingSpots(event: Event): number {
  return event.capacity - (event.reservations ? event.reservations.length : 0);
}

/** Check if the event is full */
isEventFull(event: Event): boolean {
  return this.getRemainingSpots(event) <= 0;
}

/** Handle reservation click */
reserveSpot(event: Event): void {
  if (this.isEventFull(event)) return;
  // Implement reservation logic here (call API, show modal, etc.)
  console.log(`Reserved a spot for event: ${event.title}`);
}
}
