import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LancamentosListComponent } from './pages/lancamentos/lancamentos-list.component';
import { LancamentoFormComponent } from './pages/lancamentos/lancamento-form.component';
import { CategoriasComponent } from './pages/categorias/categorias.component';
import { VisaoGeralComponent } from './pages/visao-geral/visao-geral.component';
import { authGuard, guestGuard } from './services/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'lancamentos', component: LancamentosListComponent, canActivate: [authGuard] },
  { path: 'novo', component: LancamentoFormComponent, canActivate: [authGuard] },
  { path: 'editar/:id', component: LancamentoFormComponent, canActivate: [authGuard] },
  { path: 'categorias', component: CategoriasComponent, canActivate: [authGuard] },
  { path: 'visao-geral', component: VisaoGeralComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
