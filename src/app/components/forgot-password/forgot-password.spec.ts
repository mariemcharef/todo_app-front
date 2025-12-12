import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ForgotPassword } from './forgot-password';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';
import { authService } from '../../services/auth/auth-service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

class ToastrMock {
  success = vi.fn();
  error = vi.fn();
}

describe('ForgotPassword Component (Vitest)', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let mockAuthService: any;
  let mockToastr: ToastrMock;

  beforeEach(async () => {
    mockAuthService = {
      forgotPassword: vi.fn()
    };
    mockToastr = new ToastrMock();

    await TestBed.configureTestingModule({
      imports: [ForgotPassword, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: authService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.forgotPasswordForm.controls['email'].setValue('');
    component.onSubmit();
    expect(component.isLoading).toBe(false);
  });

  it('should call forgotPassword with correct payload', () => {
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    mockAuthService.forgotPassword.mockReturnValue(of({ status: 200, message: 'Email sent' }));

    component.onSubmit();

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(component.isLoading).toBe(false);
  });

  it('should handle success response (200)', () => {
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    mockAuthService.forgotPassword.mockReturnValue(of({ status: 200, message: 'Email sent' }));

    component.onSubmit();

    expect(mockToastr.success).toHaveBeenCalledWith('Email sent');
    expect(component.isLoading).toBe(false);
  });

  it('should show error when backend returns failure', () => {
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    mockAuthService.forgotPassword.mockReturnValue(of({ status: 400, message: 'Invalid email' }));

    component.onSubmit();

    expect(mockToastr.error).toHaveBeenCalledWith('Invalid email');
    expect(component.isLoading).toBe(false);
  });

  it('should handle API error', () => {
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    mockAuthService.forgotPassword.mockReturnValue(throwError(() => new Error('server error')));

    component.onSubmit();

    expect(mockToastr.error).toHaveBeenCalledWith('An error occurred. Try again.');
    expect(component.isLoading).toBe(false);
  });
});
