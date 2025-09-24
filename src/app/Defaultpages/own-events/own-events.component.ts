import { Component, OnInit } from '@angular/core';
import { EventService, Event } from '../../services/event.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-own-events',
  templateUrl: './own-events.component.html',
  styleUrls: ['./own-events.component.css']
})
export class OwnEventsComponent implements OnInit {

  userEvents: Event[] = [];
  loading: boolean = false;
  error: string = '';

  showEditModal: boolean = false;
  editEvent!: Event;

  constructor(private eventService: EventService, private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUserEvents();
  }

  fetchUserEvents(): void {
    this.loading = true;
    // Assuming we have user ID from JWT
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.userEvents = data.filter(event => event.organizerId === userId);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load your events.';
        this.loading = false;
      }
    });
  }

  isEventFull(event: Event): boolean {
    return (event.capacity - (event.reservations?.length || 0)) <= 0;
  }

  isEventEnded(event: Event): boolean {
    return new Date(event.endDate).getTime() < new Date().getTime();
  }

// ---------------- Status Enhancements ----------------
getEventStatus(event: Event): string {
  const now = new Date();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const remainingSpots = event.capacity - (event.reservations?.length || 0);

  if (now.getTime() >= end) return 'Ended';
  if (remainingSpots <= 0) return 'Full';
  if (now.getTime() >= start && now.getTime() < end) return 'Started';
  return 'Not Started Yet';
}

// ---------------- Full Event Countdown ----------------
getFullStatus(event: Event): string {
  const start = new Date(event.startDate).getTime();
  const now = new Date().getTime();
  const diff = start - now;

  if (diff <= 0) return 'Full (Starting Soon)';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min`);

  return `Full (Starts in ${parts.join(' ')})`;
}

// ---------------- Sorting Events ----------------
sortUserEvents(): void {
  this.userEvents.sort((a, b) => {
    const now = new Date().getTime();
    const startA = new Date(a.startDate).getTime();
    const endA = new Date(a.endDate).getTime();
    const startB = new Date(b.startDate).getTime();
    const endB = new Date(b.endDate).getTime();

    const statusOrder = (event: Event) => {
      if (now < startA) return 0; // Not Started Yet
      if (now >= startA && now < endA) return 1; // Started
      return 2; // Ended
    };

    return statusOrder(a) - statusOrder(b);
  });
}

  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const created = new Date(dateStr);
    const diff = now.getTime() - created.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // ---------------- Edit Event ----------------
  openEditEvent(event: Event): void {
    this.editEvent = { ...event };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden'; // Disable scrolling
  }

  closeEditModal(): void {
    this.showEditModal = false;
    document.body.style.overflow = 'auto'; // Enable scrolling
  }

  submitEditEvent(): void {
    if (!this.editEvent.title || !this.editEvent.description || !this.editEvent.location) {
      alert('Please fill in all required fields.');
      return;
    }

    this.eventService.updateEvent(this.editEvent.id!, this.editEvent).subscribe({
      next: (updatedEvent) => {
        alert(`Event "${updatedEvent.title}" updated successfully!`);
        this.closeEditModal();
        this.fetchUserEvents();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update event. Please try again.');
      }
    });
  }

  // ---------------- Delete Event ----------------
  deleteEvent(event: Event): void {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    this.eventService.deleteEvent(event.id!).subscribe({
      next: () => {
        alert(`Event "${event.title}" deleted successfully!`);
        this.fetchUserEvents();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to delete event. Please try again.');
      }
    });
  }


  
}
