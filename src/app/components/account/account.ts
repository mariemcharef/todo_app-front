import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { authService } from '../../services/auth/auth-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../classes/interfaces/User';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], 
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit {
   form!: FormGroup;
  currentUser!: User;

  constructor(private fb: FormBuilder, private authService: authService) {}
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.form = this.fb.group({
          email: [{ value: user.email, disabled: false }, [Validators.required]],
          first_name: [user.first_name, [Validators.required]],
          last_name: [user.last_name, [Validators.required]],
        });
      }
    });
  }

  update() {
    if (this.form.invalid) return;

    this.authService.updateUser(this.currentUser.id || -1, this.form.value).subscribe({
      next: (res: any) => {
        alert('Updated successfully!');
        if (res.new_token) {
          localStorage.setItem('token', res.new_token);
        }
      },
      error: () => alert('Error updating user')
    });
  }
}