import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ForgotPasswordModel, ForgotPasswordResponse } from '../../classes/interfaces/ForgotPassword';
import { authService } from '../../services/auth/auth-service';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit{
  forgotPasswordForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authservice: authService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload: ForgotPasswordModel = this.forgotPasswordForm.value;

    this.authservice.forgotPassword(payload).subscribe({
      next: (res: ForgotPasswordResponse) => {
        if (res.status === 200) {
          this.toastr.success(res.message);
          this.router.navigate(['/login']);
        } else {
          this.toastr.error(res.message);
        }
        this.isLoading = false;
      },

      error: () => {
        this.toastr.error("An error occurred. Try again.");
        this.isLoading = false;
      },
    });
  }
}
