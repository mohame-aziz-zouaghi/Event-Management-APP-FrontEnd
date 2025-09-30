import { Component, Input, OnInit, HostListener } from '@angular/core';
import { CommentDTO, CommentService } from 'src/app/services/comments.service';
import { ReplyDTO, ReplyService } from 'src/app/services/replies.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.css']
})
export class CommentSectionComponent implements OnInit {
  @Input() eventId!: number;

  comments: CommentDTO[] = [];
  replies: { [commentId: number]: ReplyDTO[] } = {};
  userMap: { [userId: number]: { username: string; profilePicture: string } } = {};

  newComment = '';
  newReply: { [commentId: number]: string } = {};
  editContent: string = '';

  dropdownCommentId: number | null = null;
  dropdownReplyId: number | null = null;

  editingCommentId: number | null = null;
  editingReplyId: number | null = null;

  backendUrl = 'http://localhost:8089'; // backend url

  constructor(
    private commentService: CommentService,
    private replyService: ReplyService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.commentService.getCommentsByEvent(this.eventId).subscribe(comments => {
      this.comments = comments;
      this.comments.forEach(comment => {
        this.loadUser(comment.userId);
        this.loadReplies(comment.id);
      });
    });
  }

  loadReplies(commentId: number): void {
    this.replyService.getRepliesByComment(commentId).subscribe(replies => {
      this.replies[commentId] = replies;
      replies.forEach(reply => this.loadUser(reply.userId));
    });
  }

  loadUser(userId: number): void {
    if (this.userMap[userId]) return;
    this.userService.getUserByid(userId).subscribe(user => {
      this.userMap[userId] = {
        username: user.username,
        profilePicture: this.backendUrl + user.profilePicture || 'assets/img/default-avatar.png'
      };
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    const currentUserId = this.getCurrentUserId();
    this.commentService.addComment(currentUserId, this.eventId, this.newComment).subscribe(() => {
      this.newComment = '';
      this.loadComments();
    });
  }

  addReply(commentId: number): void {
    const replyText = this.newReply[commentId];
    if (!replyText || !replyText.trim()) return;
    const currentUserId = this.getCurrentUserId();
    this.replyService.addReply(currentUserId, commentId, replyText).subscribe(() => {
      this.newReply[commentId] = '';
      this.loadReplies(commentId);
    });
  }

  getCurrentUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  }

  timeSince(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  isCommentOwner(comment: CommentDTO): boolean {
    return comment.userId === this.getCurrentUserId();
  }

  isReplyOwner(reply: ReplyDTO): boolean {
    return reply.userId === this.getCurrentUserId();
  }

  toggleDropdownComment(commentId: number) {
    this.dropdownCommentId = this.dropdownCommentId === commentId ? null : commentId;
  }

  toggleDropdownReply(replyId: number) {
    this.dropdownReplyId = this.dropdownReplyId === replyId ? null : replyId;
  }

  startEditComment(comment: CommentDTO) {
    this.editingCommentId = comment.id;
    this.editContent = comment.content;
    this.dropdownCommentId = null;
  }

  saveEditComment(comment: CommentDTO) {
    if (!this.editContent.trim()) return;
    this.commentService.updateComment(comment.id, this.editContent).subscribe(() => {
      this.editingCommentId = null;
      this.loadComments();
    });
  }

  cancelEditComment() {
    this.editingCommentId = null;
  }

  deleteComment(comment: CommentDTO) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(comment.id).subscribe(() => this.loadComments());
    }
  }

  startEditReply(reply: ReplyDTO) {
    this.editingReplyId = reply.id;
    this.editContent = reply.content;
    this.dropdownReplyId = null;
  }

  saveEditReply(reply: ReplyDTO) {
    if (!this.editContent.trim()) return;
    this.replyService.updateReply(reply.id, this.editContent).subscribe(() => {
      this.editingReplyId = null;
      this.loadReplies(reply.commentId);
    });
  }

  cancelEditReply() {
    this.editingReplyId = null;
  }

  deleteReply(reply: ReplyDTO) {
    if (confirm('Are you sure you want to delete this reply?')) {
      this.replyService.deleteReply(reply.id).subscribe(() => this.loadReplies(reply.commentId));
    }
  }

@HostListener('document:click', ['$event'])
handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;

  // Check if click is inside any comment dropdown trigger or menu
  const commentDropdown = document.querySelector(`#comment-dropdown-${this.dropdownCommentId}`);
  const replyDropdown = document.querySelector(`#reply-dropdown-${this.dropdownReplyId}`);

  const clickedInsideComment = commentDropdown?.contains(target);
  const clickedInsideReply = replyDropdown?.contains(target);

  if (!clickedInsideComment) this.dropdownCommentId = null;
  if (!clickedInsideReply) this.dropdownReplyId = null;
}

}
