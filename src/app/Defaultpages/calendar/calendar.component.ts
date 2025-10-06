import { Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';

import { CalendarService, CalendarEvent } from 'src/app/services/calendar.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @ViewChild('fullcalendar', { static: false }) calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
eventClick: (info) => {
  const evt = info.event;
  const ext = (evt.extendedProps as any) || {};
  
  const now = new Date();
  const eventEnd = evt.end ? new Date(evt.end) : null;
  const canCancel = eventEnd && eventEnd >= now && ext.status !== 'CANCELLED';

  let message =
    `📌 Title: ${evt.title}\n` +
    `📅 Status: ${ext.status || 'N/A'}\n` +
    `🕒 Start: ${evt.start?.toLocaleString()}\n` +
    `🕒 End: ${evt.end?.toLocaleString()}`;

  if (canCancel) {
    message += `\n\nDo you want to cancel this reservation?`;

    // Confirmation dialog
    const confirmed = confirm(message);
    if (confirmed) {
      const eventId = evt.id ? parseInt(evt.id) : null;
      if (eventId) {
        this.reservationService.cancelReservation(eventId).subscribe({
          next: () => {
            alert('Reservation cancelled successfully.');
            evt.remove(); // Remove from calendar view
            this.events = this.events.filter(e => e.eventId !== eventId); // Update local array
          },
          error: (err) => {
            console.error(err);
            alert('Failed to cancel reservation. Please try again.');
          }
        });
      }
    }
  } else {
    message += `\n\nThis reservation cannot be cancelled (already cancelled).`;
    alert(message);
  }
}
,
    dateClick: (info) => {
      const api = this.calendarComponent?.getApi();
      if (api) api.changeView('timeGridDay', info.date);
    }
  };

  constructor(
    private calendarService: CalendarService,
    private authService: AuthService,
    private reservationService : ReservationService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to view your calendar.');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    this.calendarService.getUserCalendar(userId).subscribe({
      next: (events) => {
        this.events = events || [];
        this.calendarOptions = {
          ...this.calendarOptions,
          events: this.events.map(e => ({
            id: e.reservationId ? String(e.reservationId) : undefined,
            title: e.eventTitle ? e.eventTitle : 'Untitled',
            start: (e as any).startDate ?? (e as any).start ?? new Date().toISOString(),
            end: (e as any).endDate ?? (e as any).end ?? undefined,
            color: this.getStatusColor(e.status),
            extendedProps: { status: e.status }
          }))
        };
      },
      error: (err) => console.error('Failed to load events', err)
    });
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'CONFIRMED': return '#28a745'; // green
      case 'PENDING': return '#ffc107';   // yellow
      case 'CANCELLED': return '#dc3545'; // red
      default: return '#007bff';          // blue
    }
  }

  get hasNoEvents(): boolean {
    return Array.isArray(this.events) && this.events.length === 0;
  }


get hasNoUpcomingWeekReservations(): boolean {
  const now = new Date().getTime();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  const weekEndTime = oneWeekLater.getTime();

  // Filter future events within the next 7 days that are not cancelled
  const upcomingWeekEvents = this.events.filter(event => {
    if (!event.startDate) return false; // ignore events without start date
    if (event.status === 'CANCELLED') return false; // ignore cancelled events
    const eventStartTime = new Date(event.startDate).getTime();
    return eventStartTime >= now && eventStartTime <= weekEndTime;
  });

  return upcomingWeekEvents.length === 0;
}

getNextReservationMessage(): string {
  const now = new Date();
  const nowTime = now.getTime();

  // Filter events that start in the future (including today)
  const futureEvents = this.events
    .filter(e => e.status === 'PENDING' || e.status === 'CONFIRMED')
    .filter(event => event.startDate && new Date(event.startDate).getTime() >= nowTime)
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

  if (futureEvents.length === 0) {
    return "You have no upcoming reservations.";
  }

  const nextEvent = futureEvents[0];
  const startDate = new Date(nextEvent.startDate!);

  // Check if the event is today
  const isToday = startDate.toDateString() === now.toDateString();

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  const timeFormatted = startDate.toLocaleTimeString('en-US', options);

  if (isToday) {
    return `Your next reservation "${nextEvent.eventTitle}" is today at ${timeFormatted}.`;
  } else {
    // Format date professionally
    const fullOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedDate = startDate.toLocaleString('en-US', fullOptions);
    return `Your next reservation "${nextEvent.eventTitle}" is on ${formattedDate}.`;
  }
}

}
