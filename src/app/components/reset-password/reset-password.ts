import { Component , OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { authService } from '../../services/auth/auth-service';
import { ActivatedRoute, Router,RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  resetPasswordForm: FormGroup;
  loading: boolean = false;
  errorMessage = '';
  successMessage = '';
  resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: authService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_new_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token') || '';
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_new_password')?.value
      ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      reset_password_token: this.resetToken,
      ...this.resetPasswordForm.value
    };

    this.authService.resetPassword(data).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.successMessage = 'Password reset successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password';
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred';
        this.loading = false;
      }
    });
  }
}