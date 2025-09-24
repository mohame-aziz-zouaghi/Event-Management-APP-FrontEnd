import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventsComponent } from './Defaultpages/events/events.component';
import { HomeComponent } from './Defaultpages/home/home.component';
import { OwnEventsComponent } from './Defaultpages/own-events/own-events.component';

const routes: Routes = [
  // Redirect root path to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Lazy load AuthModule for auth-related routes
  { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) }, 
  { path: 'events', component: EventsComponent },
  { path: 'ownevents', component: OwnEventsComponent },
  { path: 'home', component: HomeComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
