import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth-service';
import { HttpClientService } from '../HttpClient/http-client-service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('authService', () => {
  let service: authService;
  let httpMock: any;
  let routerMock: any;

  beforeEach(() => {
    httpMock = {
      post: vi.fn(),
      patch: vi.fn(),
      get: vi.fn(),
      put: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    service = new authService(httpMock, routerMock);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and store token', async () => {
    const tokenResponse = { access_token: 'fake.token.value' };
    vi.spyOn(service as any, 'decodeToken').mockReturnValue({ user: { id: 1, email: 'test@test.com' } });
    httpMock.post.mockReturnValue(of(tokenResponse));

    service.login({ username: 'test', password: '1234' }).subscribe(res => {
      expect(localStorage.getItem('token')).toBe('fake.token.value');
      service.getCurrentUser().subscribe(user => {
        expect(user).toEqual({ id: 1, email: 'test@test.com' });
      });
    });
  });

  it('should logout and clear token', async () => {
    localStorage.setItem('token', 'fake.token');
    httpMock.get.mockReturnValue(of({ message: 'Logout successfully', status: 200 }));

    service.logout().subscribe(res => {
      expect(localStorage.getItem('token')).toBeNull();
      service.getCurrentUser().subscribe(user => {
        expect(user).toBeNull();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      });
    });
  });

  it('should register user', () => {
    const user = { email: 'test@test.com', first_name: 'Test', last_name: 'User' };
    const response = { message: 'User created', status: 201 };
    httpMock.post.mockReturnValue(of(response));

    service.register(user).subscribe(res => {
      expect(res).toEqual(response);
      expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/users`, user);
    });
  });

  it('should call forgotPassword API', () => {
    const data = { email: 'test@test.com' };
    const response = { message: 'Email sent', status: 200 };
    httpMock.post.mockReturnValue(of(response));

    service.forgotPassword(data).subscribe(res => {
      expect(res).toEqual(response);
      expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/forgotPassword`, data);
    });
  });

  it('should call resetPassword API', () => {
    const data = { reset_password_token: 'token', new_password: '1234', confirm_new_password: '1234' };
    const response = { message: 'Password reset', status: 200 };
    httpMock.patch.mockReturnValue(of(response));

    service.resetPassword(data).subscribe(res => {
      expect(res).toEqual(response);
      expect(httpMock.patch).toHaveBeenCalledWith(`${environment.apiUrl}/resetPassword`, data);
    });
  });

  it('should call confirmAccount API', () => {
    const code = 'confirm123';
    const response = { message: 'Account confirmed', status: 200 };
    httpMock.patch.mockReturnValue(of(response));

    service.confirmAccount(code).subscribe(res => {
      expect(res).toEqual(response);
      expect(httpMock.patch).toHaveBeenCalledWith(`${environment.apiUrl}/confirmAccount`, { code });
    });
  });

  it('should update user and refresh token', async () => {
    const response = { new_token: 'new.fake.token' };
    vi.spyOn(service as any, 'decodeToken').mockReturnValue({ user: { id: 1, email: 'updated@test.com' } });
    httpMock.put.mockReturnValue(of(response));

    service.updateUser(1, { first_name: 'Updated' }).subscribe(res => {
      expect(localStorage.getItem('token')).toBe('new.fake.token');
      service.getCurrentUser().subscribe(user => {
        expect(user).toEqual({ id: 1, email: 'updated@test.com' });
      });
    });
  });

  it('should return null when no token is stored', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
