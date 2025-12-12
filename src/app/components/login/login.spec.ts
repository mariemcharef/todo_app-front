import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { authService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { vi } from 'vitest';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';

class MockAuthService {
  login = vi.fn();
}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: MockAuthService;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: authService, useValue: mockAuthService },
        provideRouter([]) 
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
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

  it('should navigate to /tasks on successful login', async () => {
    mockAuthService.login.mockReturnValue(of({ status: 200 }));
    const navigateSpy = vi.spyOn(router, 'navigate');
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    
    expect(navigateSpy).toHaveBeenCalledWith(['/tasks']);
    expect(component.loading).toBe(false);
  });

  it('should display error message on failed login', async () => {
    mockAuthService.login.mockReturnValue(of({ 
      status: 401, 
      message: 'Invalid credentials' 
    }));
    const navigateSpy = vi.spyOn(router, 'navigate');
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'wrongpassword'
    });
    
    component.onSubmit();
    

    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should handle error response from authService', async () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Network error' } }))
    );
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    
    expect(component.errorMessage).toBe('Network error');
    expect(component.loading).toBe(false);
  });

  it('should handle error without specific message', async () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: {} }))
    );
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    // Wait for async operations to complete
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    
    expect(component.errorMessage).toBe('An error occurred');
    expect(component.loading).toBe(false);
  });

  it('should set loading state during login', () => {
    const delayedObservable = new Observable(subscriber => {
      setTimeout(() => {
        subscriber.next({ status: 200 });
        subscriber.complete();
      }, 100);
    });
    mockAuthService.login.mockReturnValue(delayedObservable);
    
    component.loginForm.setValue({
      username: 'test@example.com',
      password: 'password123'
    });
    
    expect(component.loading).toBe(false);
    component.onSubmit();
    expect(component.loading).toBe(true);
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
});