import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  profilePreview: string | ArrayBuffer | null = null; // for image preview
  profileBase64: string | null = null; // for sending to backend

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

ngOnInit() {
  this.registerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(3)]],
    lastName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [
      Validators.required, 
      Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    ]],
    dateOfBirth: ['', Validators.required],
    genre: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });
}

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

onRegister() {
  if (this.registerForm.valid) {
    // Create payload excluding confirmPassword
    const { confirmPassword, ...formValues } = this.registerForm.value;

    const payload = { 
      ...formValues,
      profilePicture: this.profileBase64 // include the Base64 image
    };

    this.authService.register(payload).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => console.error(err)
    });
  }
}

  onProfileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview = reader.result;
        this.profileBase64 = reader.result as string;
      };
      reader.readAsDataURL(file); // convert to Base64 string
    }
  }

  // Getter shortcuts for template validation
  get firstName() { return this.registerForm.get('firstName')!; }
  get lastName() { return this.registerForm.get('lastName')!; }
  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get dateOfBirth() { return this.registerForm.get('dateOfBirth')!; }
  get genre() { return this.registerForm.get('genre')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }
}