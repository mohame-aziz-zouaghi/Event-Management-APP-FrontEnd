import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userImageSource = new BehaviorSubject<string>('assets/img/default-avatar.png');
  userImage$ = this.userImageSource.asObservable();

  setUserImage(url: string) {
    this.userImageSource.next(url);
    localStorage.setItem('userImage', url);
  }
}