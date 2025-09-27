import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../services/user.service';

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
    private userService: UserService // inject service

  ) {}

  ngOnInit(): void {
    this.checkAuth();

    // Listen for token changes in other tabs/windows
    window.addEventListener('storage', () => {
      this.checkAuth();
    });
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
    if (!this.userId) return;

    this.userService.getUserByid(this.userId).subscribe({
      next: (user) => {
        if (user.profilePicture) {
          // Assuming your backend serves images at /users/{filename}
          this.userImage = this.backendUrl + user.profilePicture;
          console.log(this.userImage);
        } else {
          this.userImage = 'assets/img/default-avatar.png';
        }
        localStorage.setItem('userImage', this.userImage); // cache for fast load
      },
      error: (err) => {
        console.error('Failed to load user image', err);
        this.userImage = 'assets/img/default-avatar.png';
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
}
