import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { authService } from '../../services/auth/auth-service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
})
export class Nav {
  constructor(
    public authService: authService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout().subscribe();
    this.router.navigate(['/login']);
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
