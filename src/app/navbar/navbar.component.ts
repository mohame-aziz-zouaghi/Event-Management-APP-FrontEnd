import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

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

  // Reference to the dropdown button/container
  @ViewChild('dropdownBtn') dropdownBtn!: ElementRef;

  constructor(
    private router: Router,
    private authService: AuthService
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
    }

    const storedUserImg = localStorage.getItem('userImage');
    this.userImage = storedUserImg ? storedUserImg : 'assets/img/default-avatar.png';
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
