import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CommonModule } from '@angular/common';

class MockAuthService {
  login = vi.fn();
}

class MockRouter {
  navigate = vi.fn();
}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: MockAuthService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: authService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      username: '',
      password: ''
    });
  });

  it('should validate required fields', () => {
    expect(component.loginForm.valid).toBe(false);
    
    component.loginForm.controls['username'].setValue('test@example.com');
    component.loginForm.controls['password'].setValue('password123');
    
    expect(component.loginForm.valid).toBe(true);
  });

  it('should validate email format', () => {
    const usernameControl = component.loginForm.controls['username'];
    
    usernameControl.setValue('invalid-email');
    expect(usernameControl.hasError('email')).toBe(true);
    
    usernameControl.setValue('valid@example.com');
    expect(usernameControl.hasError('email')).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login on valid form submission', () => {
    mockAuthService.login.mockReturnValue(of({ status: 200 }));
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123'
    });
  });

  it('should navigate to /tasks on successful login', () => {
    mockAuthService.login.mockReturnValue(of({ status: 200 }));
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
    expect(component.loading).toBe(false);
  });

  it('should display error message on failed login', () => {
    mockAuthService.login.mockReturnValue(of({ 
      status: 401, 
      message: 'Invalid credentials' 
    }));
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'wrongpassword'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle error response from authService', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Network error' } }))
    );
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Network error');
    expect(component.loading).toBe(false);
  });

  it('should handle error without specific message', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: {} }))
    );
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('An error occurred');
  });

  it('should set loading state during login', () => {
    mockAuthService.login.mockReturnValue(of({ status: 200 }));
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    expect(component.loading).toBe(false);
    component.onSubmit();
    expect(component.loading).toBe(false);
  });

  it('should clear error message on new submission', () => {
    component.errorMessage = 'Previous error';
    mockAuthService.login.mockReturnValue(of({ status: 200 }));
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('');
  });

  it('should redirect to Google OAuth on loginWithGoogle', () => {
    const originalHref = window.location.href;  
    const hrefSpy = vi.fn();
    Object.defineProperty(window.location, 'href', {
      set: hrefSpy,
      configurable: true
    });
    
    component.loginWithGoogle();
    
    expect(hrefSpy).toHaveBeenCalledWith(expect.stringContaining('/login/google'));
    Object.defineProperty(window.location, 'href', {
      value: originalHref,
      configurable: true,
      writable: true
    });
  });
});