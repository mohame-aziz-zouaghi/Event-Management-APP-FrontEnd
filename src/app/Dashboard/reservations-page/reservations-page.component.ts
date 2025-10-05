import { Component, OnInit } from '@angular/core';
import { ReservationService, Reservation } from '../../services/reservation.service';
import { FormControl } from '@angular/forms';
import { startOfDay, endOfDay } from 'date-fns';

@Component({
  selector: 'app-reservations-page',
  templateUrl: './reservations-page.component.html',
  styleUrls: ['./reservations-page.component.css']
})
export class ReservationsPageComponent implements OnInit {

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];

// Selected filters
selectedStatus: string = '';
selectedDay: number | null = null;
selectedMonth: number | null = null;
selectedYear: number | null = null;
searchQuery: string = '';
filtersTouched: boolean = false;

  loading: boolean = false;

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getAllReservations().subscribe({
      next: (res) => {
        this.reservations = res;
        this.filteredReservations = [...this.reservations];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load reservations', err);
        this.loading = false;
      }
    });
  }

  // ---------------- Filters ----------------
// Apply filters
applyFilters(): void {
  this.filtersTouched =
    !!this.searchQuery ||
    !!this.selectedStatus ||
    !!this.selectedDay ||
    !!this.selectedMonth ||
    !!this.selectedYear;

  this.filteredReservations = this.reservations.filter(r => {
    const resDate = new Date(r.reservationDate);
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesDay = true;
    let matchesMonth = true;
    let matchesYear = true;

    // Search by username or event title
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      matchesSearch =
        r.username.toLowerCase().includes(query) ||
        r.eventtitle.toLowerCase().includes(query);
    }

    // Filter by status
    if (this.selectedStatus) {
      matchesStatus = r.status === this.selectedStatus;
    }

    // Filter by day
    if (this.selectedDay != null) {
      matchesDay = resDate.getDate() === this.selectedDay;
    }

    // Filter by month
    if (this.selectedMonth != null) {
      matchesMonth = resDate.getMonth() + 1 === this.selectedMonth; // JS month is 0-based
    }

    // Filter by year
    if (this.selectedYear != null) {
      matchesYear = resDate.getFullYear() === this.selectedYear;
    }

    return matchesSearch && matchesStatus && matchesDay && matchesMonth && matchesYear;
  });
}


// Reset filters
resetFilters(): void {
  this.searchQuery = '';
  this.selectedStatus = '';
  this.selectedDay = null;
  this.selectedMonth = null;
  this.selectedYear = null;
  this.filtersTouched = false;
  this.applyFilters();
}
  // ---------------- Cancel Reservation ----------------
  cancelReservation(reservation: Reservation): void {
    if (!confirm(`Are you sure you want to cancel this reservation for "${reservation.eventtitle}"?`)) return;

    this.reservationService.cancelReservation(reservation.id!).subscribe({
      next: () => {
        alert('Reservation cancelled successfully!');
        this.loadReservations();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to cancel reservation.');
      }
    });
  }

}
