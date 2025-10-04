import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css']
})
export class UsersPageComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery: string = '';
  backendUrl = 'http://localhost:8089';
  genderFilter: string = 'ALL';
  roleFilter: string = 'ALL';

   // Modal & Form
  showModal = false;
  userForm: FormGroup;
  userId!: number;
  selectedFile: File | null = null;
  profilePreview: string | null = null;

  constructor(
    public userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', Validators.required],
      genre: ['', Validators.required],
      role: ['',Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  /** Load all users from backend */
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
      },
      error: (err) => console.error('Error fetching users:', err)
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onGenderChange(): void {
    this.applyFilters();
  }

  
  onRoleChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.users];

    // Search filter
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(u => u.username.toLowerCase().includes(query));
    }

    // Gender filter
    if (this.genderFilter !== 'ALL') {
      result = result.filter(u => u.genre === this.genderFilter);
    }

        // Role filter
    if (this.roleFilter !== 'ALL') {
      result = result.filter(u => u.role === this.roleFilter);
    }

    this.filteredUsers = result;
  }

  // Open Modal
  openUpdateModal(user: User): void {
    this.userId = user.id;
    this.showModal = true;
    console.log("modal is opened")

    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      genre: user.genre,
      role: user.role
    });

    this.profilePreview = user.profilePicture ? this.backendUrl + user.profilePicture : null;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedFile = null;
    this.profilePreview = null;
  }

  onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => { this.profilePreview = reader.result as string; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Delete User
  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          this.applyFilters();
        },
        error: (err) => console.error(err)
      });
    }
  }

  // UPDATE METHOD (called when form submitted)
  onSave(): void {
    if (this.userForm.invalid) return;

    const formData = new FormData();

    const userDto = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      username: this.userForm.value.username,
      email: this.userForm.value.email,
      dateOfBirth: this.userForm.value.dateOfBirth,
      genre: this.userForm.value.genre,
      role:this.userForm.value.role
    };

    formData.append('user', new Blob([JSON.stringify(userDto)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('profilePicture', this.selectedFile);
    }

    this.userService.updateUser(this.userId, formData).subscribe({
      next: (updatedUser) => {
        alert('Profile updated successfully!');
        // update user in local array
        const index = this.users.findIndex(u => u.id === this.userId);
        if (index !== -1) this.users[index] = updatedUser;
        this.applyFilters();
        this.closeModal();
      },
      error: (err) => console.error('Update failed', err)
    });
  }

/** Check if any filter/search is active */
isFilterChanged(): boolean {
  return this.searchQuery.trim() !== '' || this.genderFilter !== 'ALL' || this.roleFilter !== 'ALL';
}

  resetFilters(): void {
  this.searchQuery = '';
  this.genderFilter = 'ALL';
  this.roleFilter = 'ALL';
  this.applyFilters();
}
}

