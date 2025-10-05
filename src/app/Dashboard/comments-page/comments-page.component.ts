import { Component, OnInit } from '@angular/core';
import { CommentService, CommentDTO } from '../../services/comments.service';
import { UserService } from '../../services/user.service';
import { EventService } from '../../services/event.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-comments-page',
  templateUrl: './comments-page.component.html',
  styleUrls: ['./comments-page.component.css']
})
export class CommentsPageComponent implements OnInit {
  comments: CommentDTO[] = [];
  filteredComments: CommentDTO[] = [];

  usersMap: { [key: number]: string } = {};   // userId -> username
  eventsMap: { [key: number]: string } = {};  // eventId -> event title

  searchQuery: string = '';
  selectedDay: number | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  filtersTouched: boolean = false;

  constructor(
    private commentService: CommentService,
    private userService: UserService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  /** Load all comments */
  loadComments(): void {
    this.commentService.getAllComments().subscribe({
      next: (data) => {
        this.comments = data;
        this.loadUsernames();
        this.loadEventTitles();
      },
      error: (err) => console.error('Error loading comments:', err)
    });
  }

  /** Map userId -> username */
  loadUsernames(): void {
    const userIds = Array.from(new Set(this.comments.map(c => c.userId)));
    const observables = userIds.map(id => this.userService.getUserByid(id));

    forkJoin(observables).subscribe({
      next: (users) => {
        users.forEach(u => this.usersMap[u.id] = u.username);
        this.applyFilters();
      },
      error: (err) => console.error('Error loading usernames:', err)
    });
  }

  /** Map eventId -> event title */
  loadEventTitles(): void {
    const eventIds = Array.from(new Set(this.comments.map(c => c.eventId)));
    const observables = eventIds.map(id => this.eventService.getEventById(id));

    forkJoin(observables).subscribe({
      next: (events) => {
        events.forEach(ev => this.eventsMap[ev.id!] = ev.title);
        this.applyFilters();
      },
      error: (err) => console.error('Error loading event titles:', err)
    });
  }

  /** Apply search & date filters */
applyFilters(): void {
  this.filteredComments = this.comments.filter(comment => {
    const createdAt = new Date(comment.createdAt);

    // Search by content or user
    const matchesSearch =
      !this.searchQuery ||
      comment.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (this.usersMap[comment.userId] &&
        this.usersMap[comment.userId].toLowerCase().includes(this.searchQuery.toLowerCase()));

    // Match by year
    const matchesYear = !this.selectedYear || createdAt.getFullYear() === +this.selectedYear;

    // Match by month (getMonth() is 0-indexed, so +1)
    const matchesMonth = !this.selectedMonth || createdAt.getMonth() + 1 === +this.selectedMonth;

    // Match by day
    const matchesDay = !this.selectedDay || createdAt.getDate() === +this.selectedDay;

    return matchesSearch && matchesYear && matchesMonth && matchesDay;
  });

  this.filtersTouched =
    !!this.searchQuery || !!this.selectedDay || !!this.selectedMonth || !!this.selectedYear;
}


  /** Reset filters */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDay = null;
    this.selectedMonth = null;
    this.selectedYear = null;
    this.filtersTouched = false;
    this.applyFilters();
  }

  /** Delete a comment */
  deleteComment(comment: CommentDTO): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentService.deleteComment(comment.id).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.applyFilters();
      },
      error: (err) => console.error('Failed to delete comment:', err)
    });
  }

  /** Format date nicely */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString(); // Adjust 'medium' format if needed
  }
}
