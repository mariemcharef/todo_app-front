import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { 
  LoginCredentials, 
  TokenResponse, 
  ForgotPassword, 
  ResetPassword 
} from '../../classes/interfaces/Auth';
import { User } from '../../classes/interfaces/User';
import { BaseResponse } from '../../classes/interfaces/Response';
import { HttpClientService } from '../HttpClient/http-client-service';

@Injectable({
  providedIn: 'root'
})
export class authService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClientService, private router: Router) {
    this.restoreUserFromStorage();
  }

  private restoreUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        this.currentUserSubject.next(payload.user);
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<TokenResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap(res => {
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
          const payload = this.decodeToken(res.access_token);
          this.currentUserSubject.next(payload.user);
        }
      })
    );
  }

  loginWithGoogle(access_token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/authentication/login/google`, { access_token }).pipe(
      tap(res => {
        if (res.new_token) {
          localStorage.setItem('token', res.new_token);
          const payload = this.decodeToken(res.new_token);
          this.currentUserSubject.next(payload.user);
        }
      })
    );
  }

  register(data: User): Observable<BaseResponse> {
    return this.http.post<BaseResponse>(`${this.apiUrl}/users`, data);
  }

  forgotPassword(data: ForgotPassword): Observable<BaseResponse> {
    return this.http.post<BaseResponse>(`${this.apiUrl}/forgotPassword`, data);
  }

  resetPassword(data: ResetPassword): Observable<BaseResponse> {
    return this.http.patch<BaseResponse>(`${this.apiUrl}/resetPassword`, data);
  }

  confirmAccount(code: string): Observable<BaseResponse> {
    const payload = {code : code};
    return this.http.patch<BaseResponse>(`${this.apiUrl}/confirmAccount`, payload);
  }

  logout(): Observable<BaseResponse> {
    return this.http.get<BaseResponse>(`${this.apiUrl}/logout`).pipe(
      tap(() => {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    return this.currentUser$;
  }

  updateUser(id: number, data: any) {
    return this.http.put<BaseResponse>(`${environment.apiUrl}/users/${id}`, data).pipe(
      tap((res: any) => {
        if (res.new_token) {
          localStorage.setItem('token', res.new_token);

          const payload = this.decodeToken(res.new_token);
          if (payload?.user) {
            this.currentUserSubject.next(payload.user);
          }
        }
      })
    );
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
