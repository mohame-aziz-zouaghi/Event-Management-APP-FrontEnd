import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'EventManegementAppFront';
    showNavbar = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hiddenRoutes = ['/login', '/register']; // routes where navbar is hidden
        this.showNavbar = !hiddenRoutes.includes(event.urlAfterRedirects);
      });
  }
}
