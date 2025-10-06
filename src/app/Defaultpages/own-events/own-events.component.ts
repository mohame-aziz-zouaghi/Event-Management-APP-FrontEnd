import { Component, OnInit } from '@angular/core';
import { EventService, Event } from '../../services/event.service';
import { UserService } from '../../services/user.service';
import { Reservation, ReservationService } from 'src/app/services/reservation.service';

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
editEvent: any = {};

  showReservationsModal: boolean = false;
selectedReservations: any[] = [];
selectedNewPhotos: File[] = [];
backendUrl = 'http://localhost:8089';

  constructor(private eventService: EventService, private userService: UserService,private reservationService:ReservationService) {}

  ngOnInit(): void {
    this.fetchUserEvents();
  }

fetchUserEvents(): void {
  this.loading = true;
  const token = localStorage.getItem('token');
  if (!token) return;

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.userId;

  this.eventService.getAllEvents().subscribe({
    next: (data) => {
      this.userEvents = data.filter(event => event.organizerId === userId);

      // Sort here AFTER fetching
      this.sortUserEvents();

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
    return (event.capacity - (event.reservations?.filter(r => r.status !== 'CANCELLED').length || 0)) <= 0;
  }

  isEventEnded(event: Event): boolean {
    return new Date(event.endDate).getTime() < new Date().getTime();
  }

// ---------------- Status Enhancements ----------------
getEventStatus(event: Event): string {
  const now = new Date();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const remainingSpots = event.capacity - (event.reservations?.filter(r => r.status !== 'CANCELLED').length || 0);

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
  const now = new Date().getTime();

  this.userEvents.sort((a, b) => {
    const startA = new Date(a.startDate).getTime();
    const endA = new Date(a.endDate).getTime();
    const startB = new Date(b.startDate).getTime();
    const endB = new Date(b.endDate).getTime();

    const statusOrder = (event: Event) => {
      if (now < new Date(event.startDate).getTime()) return 0; // Not Started
      if (!this.isEventEnded(event) && this.isEventFull(event)) return 1; // Full
      if (now >= new Date(event.startDate).getTime() && now < new Date(event.endDate).getTime()) return 2; // Started
      return 3; // Ended
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

  // Submit edit (details + photos)
submitEditEvent(): void {
  if (!this.editEvent.title || !this.editEvent.description || !this.editEvent.location) {
    alert('Please fill in all required fields.');
    return;
  }

  const formData = new FormData();
  formData.append('event', new Blob([JSON.stringify(this.editEvent)], { type: 'application/json' }));

  // append new photos if any
  this.selectedNewPhotos.forEach(file => {
    formData.append('photos', file);
  });

  this.eventService.updateEvent(this.editEvent.id!, formData).subscribe({
    next: (updatedEvent) => {
      alert(`Event "${updatedEvent.title}" updated successfully!`);
      this.closeEditModal();
      this.fetchUserEvents();
      this.selectedNewPhotos = []; // reset
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

openReservations(event: Event): void {
  if (!event.reservations) {
    this.selectedReservations = [];
    this.showReservationsModal = true;
    return;
  }

  // Enrich reservations with user data
  this.selectedReservations = [];
  event.reservations.forEach(res => {
    this.userService.getUserByid(res.userId).subscribe({
      next: (user) => {
        this.selectedReservations.push({
          id:res.id,
          username: user.username,
          email: user.email,
          ticketnumber: res.ticketNumber,
          reservationDate: res.reservationDate,
          status: res.status
        });
      },
      error: () => {
        // fallback if user fetch fails
        this.selectedReservations.push({
          username: 'Unknown User',
          email: 'Not Available',
          ticketnumber: res.ticketnumber,
          reservationDate: res.reservationDate,
          status: res.status
        });
      }
    });
  });

  this.showReservationsModal = true;
  document.body.style.overflow = 'hidden'; // disable scroll
}

closeReservations(): void {
  this.showReservationsModal = false;
  document.body.style.overflow = 'auto'; // re-enable scroll
}




// Remove existing photo
removePhoto(index: number): void {
  this.editEvent.photoUrls!.splice(index, 1);
}

// Handle new photo upload
onPhotoSelected(event: any): void {
  const files = event.target.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      this.selectedNewPhotos.push(files[i]);
    console.log(this.selectedNewPhotos);
    }
  }
}


getPhotoUrl(photoPath: string): string {
  if (!photoPath) {
    console.warn('⚠️ Empty photoPath received');
    return '';
  }

  // Avoid double slashes
  const fullUrl = `${this.backendUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;

  // 🔹 Log what’s being built
  console.log('🖼️ Building photo URL:', { raw: photoPath, final: fullUrl });

  return fullUrl;
}

// ---------------- Cancel Reservation ----------------
  cancelReservation(reservation: Reservation): void {
    if (!confirm(`Are you sure you want to cancel this reservation for "${reservation.username}"?`)) return;
    console.log(reservation)

    this.reservationService.cancelReservation(reservation.id!).subscribe({
      next: () => {
        alert('Reservation cancelled successfully!');
        this.fetchUserEvents();
        this.closeReservations();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to cancel reservation.');
      }
    });
  }

    // ---------------- confirm Reservation ----------------
  confirmReservation(reservation: Reservation): void {
    this.reservationService.confirmReservation(reservation.id!).subscribe({
      next: () => {
        alert('Reservation Confirmed successfully!');
        this.fetchUserEvents();
        this.closeReservations();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to Confirm reservation.');
      }
    });


  }

  /** Count only active reservations (not cancelled) */
getActiveReservations(event: Event): number {
  if (!event.reservations) return 0;
  return event.reservations.filter(r => r.status !== 'CANCELLED').length;
}

  
}
