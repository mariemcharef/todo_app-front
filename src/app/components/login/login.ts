import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: authService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid){
       return;
    }


    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
    next: (response) => {
      if (response.access_token) { 
        this.router.navigate(['/tasks']);
        this.loading = false;
      } else {
        this.errorMessage = response.message || 'Login failed';
        this.loading = false;
      }
    },
    error: (error) => {
      this.errorMessage = error.error?.message || 'An error occurred';
      this.loading = false;
    }
  });
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/login/google`;
  }
}