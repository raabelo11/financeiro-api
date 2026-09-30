import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LancamentosListComponent } from './pages/lancamentos/lancamentos-list.component';
import { LancamentoFormComponent } from './pages/lancamentos/lancamento-form.component';
import { CategoriasComponent } from './pages/categorias/categorias.component';
import { VisaoGeralComponent } from './pages/visao-geral/visao-geral.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    LancamentosListComponent,
    LancamentoFormComponent,
    CategoriasComponent,
    VisaoGeralComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }