import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventsComponent } from './Defaultpages/events/events.component';
import { HomeComponent } from './Defaultpages/home/home.component';
import { OwnEventsComponent } from './Defaultpages/own-events/own-events.component';
import { UserSettingsComponent } from './Defaultpages/user-settings/user-settings.component';
import { CommentSectionComponent } from './Defaultpages/comment-section/comment-section.component';
import { HomePageComponent } from './Dashboard/home-page/home-page.component';
import { NotAuthedComponent } from './Defaultpages/not-authed/not-authed.component';
import { NotFoundComponent } from './Defaultpages/not-found/not-found.component';
import { AdminGuard } from './services/admin.guard';
import { AuthGuard } from './services/auth.guard';
import { UsersPageComponent } from './Dashboard/users-page/users-page.component';

const routes: Routes = [
  // Redirect root path to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Lazy load AuthModule for auth-related routes
  { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) }, 
  { path: 'events', component: EventsComponent },
  { path: 'ownevents', component: OwnEventsComponent,canActivate:[AuthGuard] },
  { path: 'usersettings', component: UserSettingsComponent,canActivate:[AuthGuard] },
  { path: 'commentsection', component: CommentSectionComponent },
  { path: 'dashboard', component: HomePageComponent ,canActivate:[AdminGuard]},
  { path: 'unauthorized', component: NotAuthedComponent },
  { path: 'Not-Found', component: NotFoundComponent },
  { path: 'home', component: HomeComponent },
  { path: 'Users', component: UsersPageComponent },
  { path: '**', component: NotFoundComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
