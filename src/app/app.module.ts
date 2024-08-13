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
import {TreeComponent} from './views/tree/tree.component';
import {ApplicationComponent as StatisticApplicationComponent} from './views/statistic/application/application.component';
import {UserComponent as StatisticUserComponent} from './views/statistic/user/user.component';
import {DatabaseComponent as DetailDatabaseComponent} from './views/detail/database/database.component';
import {DatabaseComponent as StatisticDatabaseComponent} from './views/statistic/database/database.component';
import {DashboardComponent} from './views/dashboard/dashboard.component';
import {RestComponent as SearchRestComponent} from "./views/search/rest/rest.component";
import {RestComponent as StatisticRestComponent} from "./views/statistic/rest/rest.component";
import {RestComponent as DetailSessionRestComponent} from "./views/detail/session/rest/rest.component";
import {MainComponent as SearchMainComponent} from './views/search/main/main.component';
import {MainComponent as DetailSessionMainComponent} from "./views/detail/session/main/main.component";
import {EnvRouter} from "./service/router.service";
import {FtpComponent as DetailFtpComponent} from "./views/detail/ftp/ftp.component";
import {LdapComponent as DetailLdapComponent} from "./views/detail/ldap/ldap.component";
import {SmtpComponent as DetailSmtpComponent} from "./views/detail/smtp/smtp.component";

registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
  {
    path: 'session', children: [
      {
        path: 'rest',
        children: [
          {
            path: '',
            component: SearchRestComponent,
            title: 'Recherche Appels REST',
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionRestComponent,
                title: 'Detail Appel REST'
              },
              {
                path: 'database/:id_jdbc',
                data: { type: 'rest' },
                component: DetailDatabaseComponent,
                title: 'Detail Base de donnée'
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'rest' },
                component: DetailFtpComponent,
                title: 'Detail Ftp'
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'rest' },
                component: DetailLdapComponent,
                title: 'Detail Ldap'
              },
              {
                path: 'smtp/:id_smtp',
                data: { type: 'rest' },
                component: DetailSmtpComponent,
                title: 'Detail Smtp'
              },
              {
                path: 'tree',
                data: { type: 'rest' },
                component: TreeComponent,
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
            component: SearchMainComponent,
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
                component: DetailSessionMainComponent,
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
                component: DetailDatabaseComponent,
                data: { type: 'main' },
                title: 'Detail Base de donnée'
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'main' },
                component: DetailFtpComponent,
                title: 'Detail Ftp'
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'main' },
                component: DetailLdapComponent,
                title: 'Detail Ldap'
              },
              {
                path: 'ldap/:id_smtp',
                data: { type: 'main' },
                component: DetailSmtpComponent,
                title: 'Detail Smtp'
              },
              {
                path: 'tree',
                data: { type: 'main' },
                component: TreeComponent,
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
        component: StatisticApplicationComponent,
        title: 'Statistiques Serveur'
      },
      {
        path: 'rest/:name',
        component: StatisticRestComponent,
        title: 'Statistiques API'
      },
      {
        path: 'user/:name',
        component: StatisticUserComponent,
        title: 'Statistiques Utilisateur'
      },
      {
        path: 'database/:name',
        component: StatisticDatabaseComponent,
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
    EnvRouter,
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
