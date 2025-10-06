import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './auth/jwt.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './navbar/navbar.component';
import { EventsComponent } from './Defaultpages/events/events.component';
import { HomeComponent } from './Defaultpages/home/home.component';
import { OwnEventsComponent } from './Defaultpages/own-events/own-events.component';

import { UserSettingsComponent } from './Defaultpages/user-settings/user-settings.component';
import { CommentSectionComponent } from './Defaultpages/comment-section/comment-section.component';
import { HomePageComponent } from './Dashboard/home-page/home-page.component';
import { NotFoundComponent } from './Defaultpages/not-found/not-found.component';
import { NotAuthedComponent } from './Defaultpages/not-authed/not-authed.component';
import { UsersPageComponent } from './Dashboard/users-page/users-page.component';
import { EventsPageComponent } from './Dashboard/events-page/events-page.component';
import { ReservationsPageComponent } from './Dashboard/reservations-page/reservations-page.component';
import { CommentsPageComponent } from './Dashboard/comments-page/comments-page.component';
import { RepliesPageComponent } from './Dashboard/replies-page/replies-page.component';
import { CalendarComponent } from './Defaultpages/calendar/calendar.component';
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    EventsComponent,
    HomeComponent,
    OwnEventsComponent,
    UserSettingsComponent,
    CommentSectionComponent,
    HomePageComponent,
    NotFoundComponent,
    NotAuthedComponent,
    UsersPageComponent,
    EventsPageComponent,
    ReservationsPageComponent,
    CommentsPageComponent,
    RepliesPageComponent,
    CalendarComponent // ✅ only AppComponent here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FullCalendarModule // ⬅️ add here

  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
