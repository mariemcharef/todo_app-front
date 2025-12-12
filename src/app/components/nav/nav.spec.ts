import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Nav } from './nav';
import { authService } from '../../services/auth/auth-service';
import { Router, provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

class MockAuthService {
  isAuthenticated = vi.fn();
  logout = vi.fn().mockReturnValue(of({})); 
}

describe('Nav Component', () => {
  let component: Nav;
  let fixture: ComponentFixture<Nav>;
  let mockAuth: MockAuthService;
  let router: Router;

  beforeEach(async () => {
    mockAuth = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [Nav, CommonModule],
      providers: [
        provideRouter([]),
        { provide: authService, useValue: mockAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Nav);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should logout and navigate to /login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    
    component.logout();
    
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show logout button if authenticated', async () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    const compiled = fixture.nativeElement;
    const logoutButton = compiled.querySelector('[data-testid="logout-button"]') 
      || compiled.querySelector('button'); 
    
    expect(mockAuth.isAuthenticated).toHaveBeenCalled();
    expect(logoutButton).toBeTruthy();
  });

  it('should not show logout button if not authenticated', async () => {
    mockAuth.isAuthenticated.mockReturnValue(false);

    fixture.detectChanges();
    await fixture.whenStable();
    
    const compiled = fixture.nativeElement;
    const logoutButton = compiled.querySelector('[data-testid="logout-button"]');
    
    expect(mockAuth.isAuthenticated).toHaveBeenCalled();
    expect(logoutButton).toBeFalsy();
  });
});