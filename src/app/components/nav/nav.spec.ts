import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Nav } from './nav';
import { Router, ActivatedRoute } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { of } from 'rxjs';
import { vi } from 'vitest';

// Mock authService
class MockAuthService {
  isAuthenticated = vi.fn(() => true);
  logout = vi.fn(() => of({}));
}

// Mock Router
const mockRouter = {
  navigate: vi.fn()
};

// Mock ActivatedRoute
const mockActivatedRoute = {
  snapshot: {},
  params: of({})
};

describe('Nav Component', () => {
  let component: Nav;
  let fixture: ComponentFixture<Nav>;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [Nav],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: authService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Nav);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should logout and navigate to /login', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show logout button if authenticated', () => {
    mockAuthService.isAuthenticated = vi.fn(() => true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('.btn-logout');
    expect(logoutButton).toBeTruthy();
  });

  it('should not show logout button if not authenticated', () => {
    mockAuthService.isAuthenticated = vi.fn(() => false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('.btn-logout');
    expect(logoutButton).toBeNull();
  });
});