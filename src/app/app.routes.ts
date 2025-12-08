import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TaskList } from './components/task-list/task-list';
import { AuthGuard } from './guards/auth.guard';
import { Account } from './components/account/account';
import { ResetPassword } from './components/reset-password/reset-password';
import { ConfirmAccount } from './components/confirm-account/confirm-account';
import { ForgotPassword } from './components/forgot-password/forgot-password';


export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword},
  { path: 'resetPassword', component:ResetPassword },
  { path: 'confirmAccount', component: ConfirmAccount},
  { path: 'register', component: Register },
  { path: 'tasks', component: TaskList, canActivate: [AuthGuard] },
  { path: 'account', component: Account, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/tasks' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
