import { Component, OnInit } from '@angular/core';
import { ReplyService, ReplyDTO } from '../../services/replies.service';
import { CommentDTO, CommentService } from '../../services/comments.service';
import { UserService } from '../../services/user.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-replies-page',
  templateUrl: './replies-page.component.html',
  styleUrls: ['./replies-page.component.css']
})
export class RepliesPageComponent implements OnInit {
  replies: ReplyDTO[] = [];
  filteredReplies: ReplyDTO[] = [];
  usersMap: { [key: number]: string } = {}; // userId → username
  commentsMap: { [key: number]: string } = {}; // commentId → comment content

  searchQuery: string = '';
  selectedDay: number | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  filtersTouched: boolean = false;

  loading: boolean = false;

  constructor(
    private replyService: ReplyService,
    private userService: UserService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    this.loadReplies();
  }

  loadReplies(): void {
    this.loading = true;
    this.replyService.getAllReplies().subscribe({
      next: (data) => {
        this.replies = data;
        this.loadUsersAndComments();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadUsersAndComments(): void {
    // get unique user IDs from replies
    const userIds = Array.from(new Set(this.replies.map(r => r.userId)));
    const userRequests = userIds.map(id => this.userService.getUserByid(id));

    // fetch users and all comments in parallel
    forkJoin([
      forkJoin(userRequests),
      this.commentService.getAllComments()
    ]).subscribe({
      next: ([users, comments]) => {
        // map userId -> username
        users.forEach(u => {
          if (u) this.usersMap[u.id] = u.username;
        });

        // map commentId -> content
        (comments as CommentDTO[]).forEach(c => {
          this.commentsMap[c.id] = c.content;
        });

        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  applyFilters(): void {
    this.filtersTouched =
      !!this.searchQuery || !!this.selectedDay || !!this.selectedMonth || !!this.selectedYear;

    this.filteredReplies = this.replies.filter(r => {
      const date = new Date(r.createdAt);
      let matchesSearch = true;
      let matchesDay = true;
      let matchesMonth = true;
      let matchesYear = true;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const username = this.usersMap[r.userId]?.toLowerCase() || '';
        const commentContent = this.commentsMap[r.commentId]?.toLowerCase() || '';
        matchesSearch =
          r.content.toLowerCase().includes(query) ||
          username.includes(query) ||
          commentContent.includes(query);
      }

      if (this.selectedDay != null) matchesDay = date.getDate() === this.selectedDay;
      if (this.selectedMonth != null) matchesMonth = date.getMonth() + 1 === this.selectedMonth;
      if (this.selectedYear != null) matchesYear = date.getFullYear() === this.selectedYear;

      return matchesSearch && matchesDay && matchesMonth && matchesYear;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDay = null;
    this.selectedMonth = null;
    this.selectedYear = null;
    this.filtersTouched = false;
    this.applyFilters();
  }

  deleteReply(reply: ReplyDTO): void {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    this.replyService.deleteReply(reply.id).subscribe({
      next: () => {
        this.replies = this.replies.filter(r => r.id !== reply.id);
        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Not updated yet!';
    return new Date(dateStr).toLocaleString();
  }

  
}
