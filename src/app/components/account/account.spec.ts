import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Account } from './account';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { User } from '../../classes/interfaces/User';

class MockAuthService {
  private currentUserSubject = new BehaviorSubject<User | null>({
    id: 1,
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe'
  });

  currentUser$ = this.currentUserSubject.asObservable();

  getCurrentUser = vi.fn(() =>
    of({
      id: 1,
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe'
    })
  );

  updateUser = vi.fn(() =>
    of({ message: 'Updated', new_token: 'new.token.value' })
  );
}

describe('Account Component', () => {
  let component: Account;
  let fixture: ComponentFixture<Account>;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule, Account],
      providers: [
        FormBuilder,
        { provide: authService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Account);
    component = fixture.componentInstance;
    
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  //Ensures the form is populated with the user from currentUser$.
  it('should load user data and populate the form', () => {
    expect(component.form.value).toEqual({
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe'
    });
  });

  it('should disable update if form is invalid', () => {
    component.form.controls['first_name'].setValue('');
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);
  });

  it('should call updateUser on valid update()', () => {
    component.update();
    expect(mockAuthService.updateUser).toHaveBeenCalledWith(1, {
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe'
    });
  });

  it('should not call updateUser if form is invalid', () => {
    component.form.controls['first_name'].setValue('');
    component.update();
    expect(mockAuthService.updateUser).not.toHaveBeenCalled();
  });

  it('should handle update error', () => {
    mockAuthService.updateUser = vi.fn(() => throwError(() => new Error('Update failed')));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.update();
    expect(alertSpy).toHaveBeenCalledWith('Error updating user');
  });
});