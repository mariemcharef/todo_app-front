import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TaskList } from './components/task-list/task-list';
import { AuthGuard } from './guards/auth.guard';
import { Account } from './components/account/account';


export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: 'login', component: Login },
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
