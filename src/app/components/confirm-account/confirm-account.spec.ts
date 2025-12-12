import { TestBed } from '@angular/core/testing';
import { ConfirmAccount } from './confirm-account';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth/auth-service';

describe('ConfirmAccount (Vitest)', () => {
  let component: ConfirmAccount;
  let fixture: any;

  let mockAuthService: any;
  let mockToastr: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      confirmAccount: vi.fn().mockReturnValue(of({ status: 200 })) 
    };

    mockRouter = { navigate: vi.fn() };
    mockToastr = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmAccount],
      providers: [
        { provide: authService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ confirmation_code: 'valid123' }) }
        },
        { provide: Router, useValue: mockRouter },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should confirm account successfully', () => {
    mockAuthService.confirmAccount.mockReturnValue(of({ status: 200 }));

    component.confirmAccount(); 

    expect(mockAuthService.confirmAccount).toHaveBeenCalledWith('valid123');
    expect(mockToastr.success).toHaveBeenCalledWith('Account confirmed successfully!');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show backend failure message', () => {
    mockAuthService.confirmAccount.mockReturnValue(
      of({ status: 400, message: 'Invalid code' })
    );

    component.confirmAccount();

    expect(mockToastr.error).toHaveBeenCalledWith('Invalid code');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle API error', () => {
    mockAuthService.confirmAccount.mockReturnValue(
      throwError(() => ({ error: 'server error' }))
    );

    component.confirmAccount();

    expect(mockToastr.error).toHaveBeenCalledWith('Invalid or expired confirmation link');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show error if no confirmation token is provided', async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ConfirmAccount],
      providers: [
        { provide: authService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) }
        },
        { provide: Router, useValue: mockRouter },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    const fixture2 = TestBed.createComponent(ConfirmAccount);
    fixture2.detectChanges();

    expect(mockToastr.error).toHaveBeenCalledWith('Invalid confirmation link');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
