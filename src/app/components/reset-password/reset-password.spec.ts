import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPassword } from './reset-password';
import { ReactiveFormsModule } from '@angular/forms';
import { authService } from '../../services/auth/auth-service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CommonModule } from '@angular/common';

class MockAuthService {
  resetPassword = vi.fn();
}

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let mockAuth: MockAuthService;
  let router: Router;

  beforeEach(async () => {
    mockAuth = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [ResetPassword, ReactiveFormsModule, CommonModule],
      providers: [
        provideRouter([]),
        { provide: authService, useValue: mockAuth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => 'test_code_123' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reset_code from route params', () => {
    expect(component.reset_code).toBe('test_code_123');
  });

  it('should initialize form empty', () => {
    expect(component.resetPasswordForm.value).toEqual({
      new_password: '',
      confirm_new_password: ''
    });
  });

  it('should validate required fields', () => {
    const form = component.resetPasswordForm;

    expect(form.valid).toBe(false);

    form.patchValue({
      new_password: 'abcdef',
      confirm_new_password: 'abcdef'
    });

    expect(form.valid).toBe(true);
  });

  it('should validate minLength for new_password', () => {
    const control = component.resetPasswordForm.controls['new_password'];

    control.setValue('123');
    expect(control.hasError('minlength')).toBe(true);

    control.setValue('123456');
    expect(control.hasError('minlength')).toBe(false);
  });

  it('should validate password match', () => {
    component.resetPasswordForm.patchValue({
      new_password: 'password1',
      confirm_new_password: 'password2'
    });

    expect(component.resetPasswordForm.hasError('mismatch')).toBe(true);

    component.resetPasswordForm.patchValue({
      confirm_new_password: 'password1'
    });

    expect(component.resetPasswordForm.hasError('mismatch')).toBe(false);
  });

  it('should NOT submit when form invalid', () => {
    component.onSubmit();
    expect(mockAuth.resetPassword).not.toHaveBeenCalled();
  });

  it('should call authService.resetPassword on valid submit', () => {
    mockAuth.resetPassword.mockReturnValue(of({ status: 200 }));

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();

    expect(mockAuth.resetPassword).toHaveBeenCalledWith({
      reset_password_token: 'test_code_123',
      new_password: 'password123',
      confirm_new_password: 'password123'
    });
  });

  it('should show success message then navigate to login', async () => {
    vi.useFakeTimers();

    mockAuth.resetPassword.mockReturnValue(
      of({ status: 200, message: 'OK' })
    );

    const navigateSpy = vi.spyOn(router, 'navigate');

    component.resetPasswordForm.setValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.successMessage).toBe(
      'Password reset successfully! Redirecting to login...'
    );

    vi.advanceTimersByTime(2000);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    vi.useRealTimers();
  });

  it('should display backend error message', async () => {
    mockAuth.resetPassword.mockReturnValue(
      of({ status: 400, message: 'Invalid token' })
    );

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Invalid token');
    expect(component.loading).toBe(false);
  });

  it('should handle thrown error response', async () => {
    mockAuth.resetPassword.mockReturnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Server error');
    expect(component.loading).toBe(false);
  });

  it('should handle thrown error with no message', async () => {
    mockAuth.resetPassword.mockReturnValue(
      throwError(() => ({ error: {} }))
    );

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('An error occurred');
  });

  it('should set loading = true while submitting', () => {
    const delayed$ = new Observable(sub => {
      setTimeout(() => {
        sub.next({ status: 200 });
        sub.complete();
      }, 200);
    });

    mockAuth.resetPassword.mockReturnValue(delayed$);

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    expect(component.loading).toBe(false);

    component.onSubmit();

    expect(component.loading).toBe(true);
  });

  it('should clear error/success messages before submitting', () => {
    component.errorMessage = 'old error';
    component.successMessage = 'old success';

    mockAuth.resetPassword.mockReturnValue(of({ status: 200 }));

    component.resetPasswordForm.patchValue({
      new_password: 'password123',
      confirm_new_password: 'password123'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('');
  });

  it('should handle missing reset_code from route', async () => {
    const emptyRoute = {
      snapshot: { queryParamMap: { get: () => null } }
    };

    await TestBed.resetTestingModule();
    
    await TestBed.configureTestingModule({
      imports: [ResetPassword, ReactiveFormsModule, CommonModule],
      providers: [
        provideRouter([]),
        { provide: authService, useValue: mockAuth },
        { provide: ActivatedRoute, useValue: emptyRoute }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(ResetPassword);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.reset_code).toBe('');
  });
});