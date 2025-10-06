import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventService, Event } from '../../services/event.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit, OnDestroy {

  events: Event[] = [];
  filteredEvents: Event[] = [];   // ✅ filtered list of events
  searchQuery: string = '';       // ✅ search query
  selectedFilter: string = 'all'; // ✅ filter (all, ended, full, notfull)

  loading: boolean = false;
  error: string = '';
  refreshSubscription!: Subscription; // for polling
  filterCounts = {
  all: 0,
  ended: 0,
  full: 0,
  notfull: 0
};

  // ✅ Add Event card state
  showAddEventCard: boolean = false;
  newEvent: any = {
    title: '',
    description: '',
    location: '',
    capacity: 0,
    startDate: '',
    endDate: '',
    organizerId: 0, // will be set from logged-in user
  };
  newEventPhotos: { file: File; preview: string }[] = [];


  // Backend URL prefix for photos
backendUrl = 'http://localhost:8089'; // replace with your backend if needed
  showEventModal: boolean = false;
selectedEvent: any = null;


// Properties
showPhotoModal: boolean = false;
selectedPhoto: string | null = null;

  constructor(private eventService: EventService, private userService: UserService,private reservationService: ReservationService,) {}

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
      const now = new Date().getTime();

      // Filter only approved events
      const approvedEvents = data.filter(event => event.status === 'APPROVED');

      // Sort events according to your custom logic
      this.events = approvedEvents.sort((a, b) => {
        const statusOrder = (event: Event) => {
          const start = new Date(event.startDate).getTime();
          const end = new Date(event.endDate).getTime();
          const full = this.isEventFull(event);
          const ended = this.isEventEnded(event);

          if (now < start && !full) return 0;          // Upcoming + spots left
          if (now < start && full) return 1;           // Upcoming + full
          if (now >= start && now < end && !full) return 2; // Ongoing + not full
          if (now >= start && now < end && full) return 3;  // Ongoing + full
          return 4;                                     // Ended
        };

        return statusOrder(a) - statusOrder(b);
      });

      this.loadOrganizersUsernames();
      this.updateFilterCounts();
      this.applyFilters();
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
        this.applyFilters(); // ✅ reapply filters after usernames loaded
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

/** Calculate remaining spots for an event (ignoring cancelled reservations) */
getRemainingSpots(event: Event): number {
  if (!event.reservations) return event.capacity;

  const activeReservations = event.reservations.filter(reservation => reservation.status !== 'CANCELLED');
  return event.capacity - activeReservations.length;
}

  /** Check if the event is full */
  isEventFull(event: Event): boolean {
    return this.getRemainingSpots(event) <= 0;
  }

  
  isEventStarted(event: Event): boolean {
    return new Date(event.startDate).getTime() <= new Date().getTime() &&
           new Date(event.endDate).getTime() >= new Date().getTime();
  }



reserveSpot(event: Event): void {
  if (this.isEventEnded(event)) {
    alert('Sorry, this event has already ended.');
    return;
  }

  if (this.isEventFull(event)) {
    alert('Sorry, this event is already full.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to reserve a spot.');
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.userId;

  this.reservationService.createReservation(userId, event.id!).subscribe({
    next: (res) => {
      alert(`Reservation successful! Your ticket: ${res.ticketNumber}`);
      this.fetchEvents(); // refresh events to update status
    },
    error: (err) => {
      console.error( err);

      // Handle different error cases
      let errorMsg = '';
      if (typeof err.error === 'string') {
        errorMsg = err.error; // plain text error
      } else if (err.error?.message) {
        errorMsg = err.error.message; // JSON error with message
      }

      if (errorMsg.includes('active reservation')) {
        alert('You already have an active reservation for this event.');
      } else if (errorMsg.includes('multiple attempts')) {
        alert('You already had multiple attempts reserving this event.');
      } else if (errorMsg.includes('capacity full')) {
        alert('Sorry, the event is now full.');
      } else {
        alert('Failed to reserve a spot. Please try again.');
      }
    }
  });

  
}






  /** Check if the event has ended */
  isEventEnded(event: Event): boolean {
    const now = new Date();
    const eventEnd = new Date(event.endDate);
    return eventEnd.getTime() < now.getTime();
  }

  // =========================
  // ✅ New Filtering Features
  // =========================

noEventsFound: boolean = false;

applyFilters(): void {
  this.filteredEvents = this.events.filter(event => {
    const query = this.searchQuery.toLowerCase();

    const matchesSearch =
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      (event.organizerUsername && event.organizerUsername.toLowerCase().includes(query));

    let matchesFilter = true;

    switch (this.selectedFilter) {
      case 'ended':
        matchesFilter = this.isEventEnded(event);
        break;
      case 'full':
        matchesFilter = this.isEventFull(event) && !this.isEventEnded(event);
        break;
      case 'notfull':
        matchesFilter = !this.isEventFull(event) && !this.isEventEnded(event);
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  // ✅ Update noEventsFound flag
  this.noEventsFound = this.filteredEvents.length === 0;
}

updateFilterCounts(): void {
  this.filterCounts.all = this.events.length;
  this.filterCounts.ended = this.events.filter(e => this.isEventEnded(e)).length;
  this.filterCounts.full = this.events.filter(e => this.isEventFull(e) && !this.isEventEnded(e)).length;
  this.filterCounts.notfull = this.events.filter(e => !this.isEventFull(e) && !this.isEventEnded(e)).length;
}

onSearchChange(): void {
  this.applyFilters();
  this.updateFilterCounts();
}

onFilterChange(): void {
  this.applyFilters();
  this.updateFilterCounts();
}


  // =========================
  // ✅ New Add Event Methods
  // =========================

  toggleAddEventCard(): void {
  this.showAddEventCard = !this.showAddEventCard;
  this.toggleBodyScroll();
}

// Call this when you want to close the modal
closeAddEventCard(): void {
  this.showAddEventCard = false;
  document.body.style.overflow = 'auto'; // Re-enable scrolling
}

/** Close modal when clicking outside the card */
closeAddEvent(event: MouseEvent) {
  this.showAddEventCard = false;
  this.toggleBodyScroll();
}

/** Disable/enable page scroll when modal is open */
toggleBodyScroll(): void {
  if (this.showAddEventCard) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
}

  submitNewEvent(): void {
  // Get current logged-in user ID from token
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to add an event.');
    return;
  }

  // Decode token to get userId
  const payload = JSON.parse(atob(token.split('.')[1]));
  this.newEvent.organizerId = payload.userId; // assuming you added userId in JWT

  // Validation
  if (!this.newEvent.title || !this.newEvent.description || !this.newEvent.location ||
      !this.newEvent.capacity || !this.newEvent.startDate || !this.newEvent.endDate) {
    alert('Please fill in all required fields.');
    return;
  }

  if (this.newEvent.capacity < 5) {
    alert('Capacity must be at least 5 members.');
    return;
  }

  const start = new Date(this.newEvent.startDate);
  const end = new Date(this.newEvent.endDate);

  // End date validation
  if (end <= start) {
    alert('End date must be after the start date.');
    return;
  }

  // Minimum 1 hour duration
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) {
    alert('End date must be at least 1 hour after the start date.');
    return;
  }


const formData = new FormData();
formData.append('event', JSON.stringify(this.newEvent));

// Only append photos if any
if (this.newEventPhotos && this.newEventPhotos.length > 0) {
  this.newEventPhotos.forEach(photoObj => {
    formData.append('photos', photoObj.file);
  });
}


  // Log FormData for debugging
  console.log('FormData contents:');
  for (const pair of (formData as any).entries()) {
    if (pair[1] instanceof File) {
      console.log(pair[0], pair[1].name);
    } else {
      console.log(pair[0], pair[1]);
    }
  }

  // Submit the event
  this.eventService.addEvent(formData).subscribe({
    next: (event) => {
      alert(`Event "${event.title}" added successfully!`);
      this.closeAddEventCard();// hides the modal + restores scrolling
      this.newEvent = { title: '', description: '', location: '', capacity: 5, startDate: '', endDate: '', organizerId: 0 };
      this.newEventPhotos = [];
      this.fetchEvents(); // refresh list
    },
    error: (err) => {
      console.error(err);
      alert('Failed to add event. Please try again.');
    }
  });
}


onNewPhotosSelected(event: any): void {
  const files: FileList = event.target.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      if (this.newEventPhotos.length >= 5) {
        alert('Maximum 5 photos allowed.');
        break;
      }
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newEventPhotos.push({ file, preview: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }
}

removeNewPhoto(index: number): void {
  this.newEventPhotos.splice(index, 1);
}

openEventModal(event: any) {
  this.selectedEvent = event;
  this.showEventModal = true;
  document.body.style.overflow = 'hidden'; // disable scrolling
}

closeEventModal() {
  this.showEventModal = false;
  this.selectedEvent = null;
  document.body.style.overflow = 'auto'; // enable scrolling
}

getPhotoUrl(photoPath: string): string {

  console.log(this.backendUrl + photoPath)
  // Remove leading slash to prevent double slashes
  if (photoPath.startsWith('/')) {
    photoPath = photoPath.substring(1);
  }
  return `${this.backendUrl}/${photoPath}`;
}


// Open the photo modal
openPhotoModal(photo: string) {
  this.selectedPhoto = photo;
  this.showPhotoModal = true;
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

// Close the photo modal
closePhotoModal() {
  this.showPhotoModal = false;
  this.selectedPhoto = null;
  document.body.style.overflow = 'auto';
}

/** Count only active reservations (not cancelled) */
getActiveReservations(event: Event): number {
  if (!event.reservations) return 0;
  return event.reservations.filter(r => r.status !== 'CANCELLED').length;
}



}
