import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { authService } from '../../services/auth/auth-service';
import { ConfirmAccountResponse } from '../../classes/interfaces/confirmAccount';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-account',
  imports: [CommonModule],
  templateUrl: './confirm-account.html',
  styleUrl: './confirm-account.css',
})
export class ConfirmAccount implements OnInit {
   isLoading: boolean = true;
  confirmationCode: string = '';

  constructor(
    private authService: authService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe(params => {
      this.confirmationCode = params['confirmation_code'];

      if (!this.confirmationCode) {
        this.toastr.error("Invalid confirmation link");
        this.router.navigate(['/login']);
        return;
      }
      this.confirmAccount();
    });
  }

  confirmAccount(): void {
    this.isLoading = true;
    
    if(this.confirmationCode){    
      this.authService.confirmAccount(this.confirmationCode).subscribe({
        next: (res: any) => {
          this.isLoading = false;

          if (res.status === 200) {
            this.toastr.success("Account confirmed successfully!");
            this.router.navigate(['/login']);
          } else {
            this.toastr.error(res.message || "Confirmation failed");
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error("Invalid or expired confirmation link");
          this.router.navigate(['/login']);
        }
      });
    }
  }
}