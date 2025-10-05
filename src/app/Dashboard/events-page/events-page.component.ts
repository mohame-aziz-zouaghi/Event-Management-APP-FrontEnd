import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EventService, Event } from 'src/app/services/event.service';  // ✅ use Event interface
import { UserService } from 'src/app/services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.css']
})
export class EventsPageComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
searchQuery: string = '';
selectedOrganizer: string = '';
selectedStatus: string = '';
selectedCapacity: string = '';

  filtersTouched:boolean = false;
  backendUrl = 'http://localhost:8089';
  today = new Date();

  isPhotoModalOpen = false;
  modalPhotos: string[] = [];


  // Modal handling
  isUpdateModalOpen = false;
  selectedEvent: Event | null = null;
  eventForm!: FormGroup;
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  editEvent: any;
  removedPhotos: string[] = []; // <-- add this
  selectedNewPhotos: File[] = [];



  constructor(
    private eventService: EventService,
    private userService: UserService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.initForm();
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['',Validators.required],
      location: ['',Validators.required],
      capacity: [0, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.filteredEvents = [...this.events];
        this.loadOrganizersUsernames();
      },
      error: (err) => console.error('Error loading events:', err)
    });
  }

  /** Load organizer usernames */
  loadOrganizersUsernames(): void {
    const observables = this.events.map(ev =>
      this.userService.getUserByid(ev.organizerId)
    );

    forkJoin(observables).subscribe({
      next: (users) => {
        users.forEach((user, index) => {
          this.events[index].organizerUsername = user.username;
        });
        this.applyFilters();
      },
      error: (err) => console.error('Error fetching organizers:', err)
    });
  }

  /** Filters & search */
applyFilters(): void {
  // Mark filters as touched if any filter or search is active
  this.filtersTouched =
    !!this.selectedStatus || !!this.selectedCapacity || !!this.searchQuery;

  this.filteredEvents = this.events.filter(event => {
    const remainingSpots = event.capacity - (event.reservations?.length || 0);

    // ---------------- Status Filter ----------------
    if (this.selectedStatus) {
      let statusLabel = this.isEventEnded(event)
        ? 'Ended'
        : this.isEventStarted(event)
        ? 'Ongoing'
        : 'Upcoming';

      if (this.selectedStatus === 'Full') {
        if (remainingSpots > 0) return false;
      } else if (statusLabel !== this.selectedStatus) {
        return false;
      }
    }

    // ---------------- Capacity Filter ----------------
    if (this.selectedCapacity) {
      if (this.selectedCapacity === 'Full' && remainingSpots > 0) return false;
      if (this.selectedCapacity === 'Available' && remainingSpots <= 0) return false;
    }

    // ---------------- Search Query Filter ----------------
    const query = this.searchQuery?.toLowerCase() || '';
    return (
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      (event.organizerUsername?.toLowerCase().includes(query) ?? false)
    );
  });
}





resetFilters(): void {
  this.searchQuery = '';
  this.selectedOrganizer = '';
  this.selectedStatus = '';
  this.selectedCapacity = '';
  this.filteredEvents = [...this.events];
}

  onSearchChange(): void {
    this.applyFilters();
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

  getRemainingSpots(event: Event): number {
    return event.capacity - (event.reservations ? event.reservations.length : 0);
  }

  isEventStarted(ev: Event): boolean {
    return new Date(ev.startDate).getTime() <= Date.now() &&
           new Date(ev.endDate).getTime() >= Date.now();
  }

  /** Check if the event has ended */
  isEventEnded(ev: Event): boolean {
    const now = new Date();
    return new Date(ev.endDate).getTime() < now.getTime();
  }

openUpdateModal(event: Event) {
  this.selectedEvent = event;
  this.editEvent = { ...event }; // shallow copy to edit

  this.eventForm.patchValue({
    title: event.title,
    description: event.description,
    location: event.location,
    capacity: event.capacity,
    startDate: this.formatDateForInput(event.startDate),
    endDate: this.formatDateForInput(event.endDate),
  });

  // Show first photo as preview if exists
  this.photoPreview = this.editEvent.photoUrls?.[0]
    ? this.backendUrl + this.editEvent.photoUrls[0]
    : '';
    
  this.isUpdateModalOpen = true;
}




/** Returns a message about update status */
getUpdateStatus(event: Event): Date | string {
  if (!event.updatedAt || !event.createAt) return 'Not updated yet!';

  const created = new Date(event.createAt).getTime();
  const updated = new Date(event.updatedAt).getTime();

  return updated > created ? event.updatedAt : 'Not updated yet!';
}




// Close modal
closeModal() {
  this.isUpdateModalOpen = false;
  this.selectedEvent = null;
  this.selectedFile = null;
}




formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return ''; // handle undefined or null
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}


// ---------------- Save Updates ----------------
onSave(): void {
  if (!this.selectedEvent) return;

  // Prepare the object with only the updatable fields
  const updatedEventData = {
    title: this.selectedEvent.title,
    description: this.selectedEvent.description,
    location: this.selectedEvent.location,
    capacity: this.selectedEvent.capacity,
    startDate: this.selectedEvent.startDate,
    endDate: this.selectedEvent.endDate,
    photoUrls: this.selectedEvent.photoUrls // remaining photos after any deletions
  };

  const formData = new FormData();
  formData.append(
    'event',
    new Blob([JSON.stringify(updatedEventData)], { type: 'application/json' })
  );

  // Append new photos to upload
  this.selectedNewPhotos.forEach(file => formData.append('photos', file));

  this.eventService.updateEvent(this.selectedEvent.id!, formData).subscribe({
    next: (updatedEvent) => {
      alert(`Event "${updatedEvent.title}" updated successfully!`);
      this.loadEvents();          // Refresh event list
      this.closeModal();    // Close modal and reset state
      this.selectedNewPhotos = []; // Reset newly added photos
    },
    error: (err) => {
      console.error('Update failed', err);
      alert('Failed to update event');
    }
  });
}





  deleteEvent(id: number): void {
    if (!confirm('Are you sure you want to delete this event?')) return;
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        this.events = this.events.filter(ev => ev.id !== id);
        this.applyFilters();
      },
      error: (err) => console.error('Delete failed', err)
    });
  }



/** Open modal with remaining photos */
  openPhotoModal(photos: string[]): void {
    // show ALL photos except the first one
    this.modalPhotos = photos.slice(1);
    this.isPhotoModalOpen = true;
  }

  /** Close modal */
  closePhotoModal(): void {
    this.isPhotoModalOpen = false;
    this.modalPhotos = [];
  }

 // ---------------- Get Full Photo URL ----------------
  getPhotoUrl(photoPath: string): string {
    if (!photoPath) return '';
    return `${this.backendUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  }


 // ---------------- Remove Photo from Preview ----------------
  removePhoto(index: number): void {
    if (!this.selectedEvent || !this.selectedEvent.photoUrls) return;
    this.selectedEvent.photoUrls.splice(index, 1);
  }




/** Handle new photo upload */
  onPhotoSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.selectedNewPhotos.push(files[i]);
      }
    }
  }








}
