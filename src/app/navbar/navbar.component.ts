import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../services/user.service';
import { UserStateService } from '../services/UserStateService';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  userImage = 'assets/img/default-avatar.png';
  dropdownOpen = false;
  username: string = '';
  userId:number=0;
backendUrl = 'http://localhost:8089'; 


  // Reference to the dropdown button/container
  @ViewChild('dropdownBtn') dropdownBtn!: ElementRef;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService, // inject service
    private userStateService:UserStateService

  ) {}

ngOnInit(): void {
  this.checkAuth();

  // Subscribe to image updates
  this.userStateService.userImage$.subscribe(img => {
    this.userImage = img;
  });

  // Load initial image from backend
  this.loadUserImage();
}

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  checkAuth(): void {
    const token = this.authService.getToken();
    this.isAuthenticated = !!token;

    if (token) {
      const payload = this.parseJwt(token);
      this.username = payload.sub;
            this.userId = payload.userId;
      this.loadUserImage(); // fetch image from backend
    }

    const storedUserImg = localStorage.getItem('userImage');
    this.userImage = storedUserImg ? storedUserImg : 'assets/img/default-avatar.png';
  }


loadUserImage(): void {
  const token = this.authService.getToken();
  if (!token) return;

  const payload = this.parseJwt(token);
  const userId = payload?.userId; // replace subId with the correct claim if needed
  if (!userId) return;

  this.userService.getUserByid(userId).subscribe({
    next: (user) => {
      const url = user.profilePicture ? this.backendUrl + user.profilePicture : 'assets/img/default-avatar.png';
      this.userStateService.setUserImage(url); // update navbar immediately
    },
    error: () => {
      this.userStateService.setUserImage('assets/img/default-avatar.png');
    }
  });
}

  logout() {
    this.authService.logout();
    this.isAuthenticated = false;
    this.username = '';
    this.router.navigate(['/login']);
  }

  parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return {};
    }
  }

  // Close dropdown when clicking outside of it
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.dropdownOpen) {
      const clickedInside = this.dropdownBtn?.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.dropdownOpen = false;
      }
    }
  }


  isAdmin(): boolean {
  const token = this.authService.getToken();
  if (!token) return false;

  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role === 'ADMIN' || payload.role === 'ORGANIZER'; // adjust according to your role property
}
}
