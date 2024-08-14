import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LOCALE_ID, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRouteSnapshot, Route, RouterModule, RouterStateSnapshot} from '@angular/router';
import {AppComponent} from './app.component';

import {ViewsModule} from './views/views.module';
import {SharedModule} from './shared/shared.module';

// main layout
import {HttpClientModule} from '@angular/common/http';

import {DatePipe, DecimalPipe, registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {SearchRestView} from "./views/search/rest/search-rest.view";
import {DetailSessionRestView} from "./views/detail/session/rest/detail-session-rest.view";
import {DetailDatabaseView} from "./views/detail/database/detail-database.view";
import {DetailFtpView} from "./views/detail/ftp/detail-ftp.view";
import {DetailLdapView} from "./views/detail/ldap/detail-ldap.view";
import {DetailSmtpView} from "./views/detail/smtp/detail-smtp.view";
import {TreeView} from "./views/tree/tree.view";
import {SearchMainView} from "./views/search/main/search-main.view";
import {DetailSessionMainView} from "./views/detail/session/main/detail-session-main.view";
import {StatisticApplicationView} from "./views/statistic/application/statistic-application.view";
import {StatisticRestView} from "./views/statistic/rest/statistic-rest.view";
import {StatisticUserView} from "./views/statistic/user/statistic-user.view";
import {StatisticDatabaseView} from "./views/statistic/database/statistic-database.view";
import {DashboardComponent} from "./views/dashboard/dashboard.component";
import {EnvRouter} from "./service/router.service";
import {DurationPipe} from "./shared/pipe/duration.pipe";


registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
  {
    path: 'session', children: [
      {
        path: 'rest',
        children: [
          {
            path: '',
            component: SearchRestView,
            title: 'Recherche Appels REST',
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionRestView,
                title: 'Detail Appel REST'
              },
              {
                path: 'database/:id_jdbc',
                data: { type: 'rest' },
                component: DetailDatabaseView,
                title: 'Detail Base de donnée'
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'rest' },
                component: DetailFtpView,
                title: 'Detail Ftp'
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'rest' },
                component: DetailLdapView,
                title: 'Detail Ldap'
              },
              {
                path: 'smtp/:id_smtp',
                data: { type: 'rest' },
                component: DetailSmtpView,
                title: 'Detail Smtp'
              },
              {
                path: 'tree',
                data: { type: 'rest' },
                component: TreeView,
                title: 'Arbre d\'Appels'
              },
              { path: '**', pathMatch: 'full', redirectTo: `/session/rest/:id_session` }
            ]
          },
          { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
        ]
      },
      {
        path: 'main/:type_main',
        children: [
          {
            path: '',
            component: SearchMainView,
            title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
              if (route.paramMap.get('type_main') == 'batch') {
                return 'Recherche BATCHs';
              } else if(route.paramMap.get('type_main') == 'startup') {
                return 'Recherche Serveurs';
              }
              return 'Recherche Vues';
            },
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionMainView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  if (route.paramMap.get('type_main') == 'batch') {
                    return 'Detail BATCH';
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return 'Detail Serveur';
                  }
                  return 'Detail Vue';
                },
              },
              {
                path: 'database/:id_jdbc',
                component: DetailDatabaseView,
                data: { type: 'main' },
                title: 'Detail Base de donnée'
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'main' },
                component: DetailFtpView,
                title: 'Detail Ftp'
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'main' },
                component: DetailLdapView,
                title: 'Detail Ldap'
              },
              {
                path: 'smtp/:id_smtp',
                data: { type: 'main' },
                component: DetailSmtpView,
                title: 'Detail Smtp'
              },
              {
                path: 'tree',
                data: { type: 'main' },
                component: TreeView,
                title: 'Arbre d\'appels'
              },
              { path: '**', pathMatch: 'full', redirectTo: `/main/:type_main/:id_session` }
            ]
          },
          { path: '**', pathMatch: 'full', redirectTo: `/main/:type_main` }
        ]
      },
      { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
    ]
  },
  {
    path: 'statistic',
    children: [
      {
        path: 'app/:name',
        component: StatisticApplicationView,
        title: 'Statistiques Serveur'
      },
      {
        path: 'rest/:name',
        component: StatisticRestView,
        title: 'Statistiques API'
      },
      {
        path: 'user/:name',
        component: StatisticUserView,
        title: 'Statistiques Utilisateur'
      },
      {
        path: 'database/:name',
        component: StatisticDatabaseView,
        title: 'Statistiques Base de Donnée'
      },
      { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard'
  },
  { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
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
    ViewsModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    DurationPipe,
    EnvRouter,
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
