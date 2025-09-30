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

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    EventsComponent,
    HomeComponent,
    OwnEventsComponent,
    UserSettingsComponent,
    CommentSectionComponent // ✅ only AppComponent here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule // ⬅️ add here

  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
