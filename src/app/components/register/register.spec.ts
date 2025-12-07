import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

class MockAuthService {
  register = vi.fn();
}

class MockRouter {
  navigate = vi.fn();
}

class MockToastrService {
  success = vi.fn();
  error = vi.fn();
  warning = vi.fn();
  info = vi.fn();
}

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let mockAuthService: MockAuthService;
  let mockRouter: MockRouter;
  let mockToastr: MockToastrService;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();
    mockRouter = new MockRouter();
    mockToastr = new MockToastrService();

    await TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule, CommonModule, RouterModule],
      providers: [
        { provide: authService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastrService, useValue: mockToastr },
        { 
          provide: ActivatedRoute, 
          useValue: { 
            snapshot: {}, 
            params: of({}),
            queryParams: of({})
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize register form with empty values', () => {
    expect(component.registerForm.value).toEqual({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: ''
    });
  });

  it('should validate required email field', () => {
    const emailControl = component.registerForm.controls['email'];
    
    expect(emailControl.valid).toBe(false);
    
    emailControl.setValue('test@example.com');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.controls['email'];
    
    emailControl.setValue('invalid-email');
    expect(emailControl.hasError('email')).toBe(true);
    
    emailControl.setValue('valid@example.com');
    expect(emailControl.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.registerForm.controls['password'];
    
    passwordControl.setValue('12345');
    expect(passwordControl.hasError('minlength')).toBe(true);
    
    passwordControl.setValue('123456');
    expect(passwordControl.hasError('minlength')).toBe(false);
  });

  it('should validate password match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirm_password: 'password456'
    });
    
    expect(component.registerForm.hasError('mismatch')).toBe(true);
    
    component.registerForm.patchValue({
      confirm_password: 'password123'
    });
    
    expect(component.registerForm.hasError('mismatch')).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should call authService.register on valid form submission', () => {
    mockAuthService.register.mockReturnValue(of({ status: 201 }));
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
  });

  it('should show success message and navigate to login on successful registration', () => {
    vi.useFakeTimers();
    mockAuthService.register.mockReturnValue(of({ status: 201 }));
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.successMessage).toBe('Registration successful! Please check your email for confirmation.');
    expect(mockToastr.success).toHaveBeenCalledWith(
      'Please check your email for confirmation',
      'Registration Successful!',
      { timeOut: 3000 }
    );
    expect(component.loading).toBe(false);
    
    vi.advanceTimersByTime(5000);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    
    vi.useRealTimers();
  });

  it('should display error message on failed registration', () => {
    mockAuthService.register.mockReturnValue(of({ 
      status: 400, 
      message: 'Email already exists' 
    }));
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockToastr.error).toHaveBeenCalledWith('Email already exists', 'Error');
    expect(component.loading).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle error response from authService', () => {
    mockAuthService.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Network error' } }))
    );
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Network error');
    expect(component.loading).toBe(false);
  });

  it('should handle error without specific message', () => {
    mockAuthService.register.mockReturnValue(
      throwError(() => ({ error: {} }))
    );
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('An error occurred');
  });

  it('should set loading state during registration', () => {
    mockAuthService.register.mockReturnValue(of({ status: 201 }));
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    expect(component.loading).toBe(false);
    component.onSubmit();
    expect(component.loading).toBe(false);
  });

  it('should clear messages on new submission', () => {
    component.errorMessage = 'Previous error';
    component.successMessage = 'Previous success';
    mockAuthService.register.mockReturnValue(of({ status: 201 }));
    
    component.registerForm.setValue({
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.successMessage).toBe('Registration successful! Please check your email for confirmation.');
  });

  it('should allow optional first_name and last_name', () => {
    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123'
    });
    
    expect(component.registerForm.controls['first_name'].valid).toBe(false);
    expect(component.registerForm.controls['last_name'].valid).toBe(false);
  });
});