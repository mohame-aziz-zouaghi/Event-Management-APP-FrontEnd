import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { UserService } from 'src/app/services/user.service';
import { UserStateService } from 'src/app/services/UserStateService';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit {
  userForm!: FormGroup;
  profilePreview: string | ArrayBuffer | null = null;
  userId!: number;
  backendUrl = 'http://localhost:8089';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private userStateService:UserStateService
    
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
  }

  private initForm() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', Validators.required],
      genre: ['', Validators.required],
      password: ['', [Validators.minLength(8)]], // optional for update
      profilePicture: ['']
    });
  }

  private loadUserData() {
    const token = this.authService.getToken();
    if (!token) return;

    const payload = this.parseJwt(token);
    this.userId = payload.userId; // assuming JWT contains userId

    this.userService.getUserByid(this.userId).subscribe(user => {
      this.userForm.patchValue(user);
      this.profilePreview = this.backendUrl +user.profilePicture; // backend image url
    });
  }

onSave(): void {
  if (this.userForm.invalid) return;

  const formData = new FormData();

  // Build user DTO
  const userDto = {
    firstName: this.userForm.value.firstName,
    lastName: this.userForm.value.lastName,
    username: this.userForm.value.username,
    email: this.userForm.value.email,
    dateOfBirth: this.userForm.value.dateOfBirth,
    genre: this.userForm.value.genre
  };


  // Append JSON blob
  formData.append(
    'user',
    new Blob([JSON.stringify(userDto)], { type: 'application/json' })
  );

  // Append profile picture if selected
  if (this.selectedFile) {
    formData.append('profilePicture', this.selectedFile);
  }

this.userService.updateUser(this.userId, formData).subscribe({
  next: (updatedUser) => {
    alert('Profile updated successfully!');
    // Reload image from backend
    const imgUrl = updatedUser.profilePicture 
      ? this.backendUrl + updatedUser.profilePicture 
      : 'assets/img/default-avatar.png';
    this.userStateService.setUserImage(imgUrl);

    this.loadUserData(); // reload form values
  },
  error: (err) => console.error('Update failed', err)
});

}

onProfileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedFile = input.files[0];

    // For preview
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }
}


  private parseJwt(token: string): any {
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
    } catch {
      return {};
    }
  }
}
