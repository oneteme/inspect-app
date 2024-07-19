import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppComponent } from './app.component';

import { ViewsModule } from './views/views.module';
import { SharedModule } from './shared/shared.module';

// main layout
import { HttpClientModule } from '@angular/common/http';

import { MaterialModule } from './app.material.module';

import { SessionApiComponent } from './views/session-api/session-api.component';
import { SessionDetailComponent, EnvRouter } from './views/session-detail/session-detail.component';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { SessionMainComponent } from './views/session-main/session-main.component';
import { TreeComponent } from './views/tree/tree.component';
import { StatsDatabaseComponent } from './views/stats-database/stats-database.component';
import { StatsAppComponent } from './views/stats-app/stats-app.component';
import { StatsApiComponent } from './views/stats-api/stats-api.component';
import { StatsUserComponent } from './views/stats-user/stats-user.component';
import { DbRequestDetailComponent } from './views/db-request-detail/db-request-detail.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';

registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
  {
    path: 'session', children: [
      {
        path: 'api',
        component: SessionApiComponent,
        title: 'Liste des API'
      },
      {
        path: ':type/:id/tree',
        component: TreeComponent,
        title: 'Arbre d\'appels de la Session'
      },
      {
        path: 'main',
        component: SessionMainComponent,
        title: 'Liste des Sessions'
      },
      {
        path: ':type/:id/database/:dbid', 
        component: DbRequestDetailComponent,
        title: 'Detail de la requête SQL'
      },
      {
        path: ':type/:id',
        component: SessionDetailComponent,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          if (route.paramMap.get('type') == 'main') {
            return 'Detail de la Session';
          }
          return 'Detail de l\'API';
        },
      },
      { path: '**', pathMatch: 'full', redirectTo: `/session/api` }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent, 
    title: 'Dashboard',
    children: [
      {
        path: 'app/:name',
        component: StatsAppComponent,
        title: 'Statistiques Serveur'
      },
      {
        path: 'api/:name',
        component: StatsApiComponent,
        title: 'Statistiques API'
      },
      {
        path: 'user/:name',
        component: StatsUserComponent,
        title: 'Statistiques Utilisateur'
      },
      {
        path: 'database/:name',
        component: StatsDatabaseComponent,
        title: 'Statistiques Base de Donnée'
      },
     // { path: '**', pathMatch: 'full', redirectTo: `/session/api` }
    ]
  },
  { path: '**', pathMatch: 'full', redirectTo: `/session/api` }
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, { useHash: true }),
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule,
    ViewsModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    EnvRouter,
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
