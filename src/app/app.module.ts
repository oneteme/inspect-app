import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LOCALE_ID, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRouteSnapshot, Route, RouterModule, RouterStateSnapshot} from '@angular/router';
import {AppComponent} from './app.component';

import {ViewsModule} from './views/views.module';
import {SharedModule} from './shared/shared.module';

// main layout
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import {DatePipe, DecimalPipe, I18nPluralPipe, registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {SearchRestView} from "./views/search/rest/search-rest.view";
import {DetailSessionRestView} from "./views/detail/session/rest/detail-session-rest.view";
import {DetailDatabaseView} from "./views/detail/database/detail-database.view";
import {DetailFtpView} from "./views/detail/ftp/detail-ftp.view";
import {DetailLdapView} from "./views/detail/ldap/detail-ldap.view";
import {DetailSmtpView} from "./views/detail/smtp/detail-smtp.view";
import {SearchMainView} from "./views/search/main/search-main.view";
import {DetailSessionMainView} from "./views/detail/session/main/detail-session-main.view";
import {StatisticUserView} from "./views/statistic/user/statistic-user.view";
import {StatisticDatabaseView} from "./views/statistic/database/statistic-database.view";
import {DashboardComponent} from "./views/dashboard/dashboard.component";
import {EnvRouter} from "./service/router.service";
import {DurationPipe} from "./shared/pipe/duration.pipe";
import {StatisticClientView} from "./views/statistic/view/statistic-client.view";
import {ArchitectureView} from "./views/architecture/architecture.view";
import {NumberFormatterPipe} from './shared/pipe/number.pipe';
import {TreeView} from './views/tree/tree.view';
import {SizePipe} from "./shared/pipe/size.pipe";
import {DumpView} from "./views/dump/dump.view";
import {StatisticServerView} from "./views/statistic/server/statistic-server.view";
import {DeploimentComponent} from './views/deploiment/deploiment.component';
import {Interceptor} from "./shared/interceptor/interceptor";
import {AnalyticView} from "./views/analytic/analytic.view";


registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
  {
    path: 'session', children: [
      {
        path: ':app_name/dump',
        component: DumpView
      },
      {
        path: 'rest',
        children: [
          {
            path: '',
            component: SearchRestView,
            title: 'Appel d\'API',
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionRestView,
                title: `Appel d'API > Détail`
              },
              {
                path: 'database/:id_jdbc',
                data: { type: 'rest' },
                component: DetailDatabaseView,
                title: `Appel d'API > Base de donnée`
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'rest' },
                component: DetailFtpView,
                title: `Appel d'API > FTP`
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'rest' },
                component: DetailLdapView,
                title: `Appel d'API > LDAP`
              },
              {
                path: 'smtp/:id_smtp',
                data: { type: 'rest' },
                component: DetailSmtpView,
                title: `Appel d'API > SMTP`

              },
              {
                path: 'tree',
                data: { type: 'rest' },
                component: TreeView,
                title: `Appel d'API > Arbre d'Appels`

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
                return 'Lancement de Batch';
              } else if(route.paramMap.get('type_main') == 'startup') {
                return 'Lancement de Serveur';
              }
              return 'Navigation';
            }
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionMainView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = '> Detail';
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
              },
              {
                path: 'database/:id_jdbc',
                component: DetailDatabaseView,
                data: { type: 'main' },
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = `> Base de Donnée`;
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
              },
              {
                path: 'ftp/:id_ftp',
                data: { type: 'main' },
                component: DetailFtpView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = `> FTP`;
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
              },
              {
                path: 'ldap/:id_ldap',
                data: { type: 'main' },
                component: DetailLdapView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = `> LDAP`;
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `L&ancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
              },
              {
                path: 'smtp/:id_smtp',
                data: { type: 'main' },
                component: DetailSmtpView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = `> SMTP`;
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
              },
              {
                path: 'tree',
                data: { type: 'main' },
                component: TreeView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  let detail = `> Arbre d'Appels`;
                  if (route.paramMap.get('type_main') == 'batch') {
                    return `Lancement de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  }
                  return `Navigation ${detail}`;
                }
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
    path: 'dashboard',
    children: [
      {
        path: 'server/:server_name',
        component: StatisticServerView,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          return `Dashboard > ${route.paramMap.get('server_name')}`;
        }
      },
      {
        path: 'user/:user_name',
        component: StatisticUserView,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          return `Dashboard > ${route.paramMap.get('user_name')}`;
        }
      },
      {
        path: 'database/:database_name',
        component: StatisticDatabaseView,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          return `Dashboard > ${route.paramMap.get('database_name')}`;
        }
      },
      {
        path: 'client/:client_name',
        component: StatisticClientView,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          return `Dashboard > ${route.paramMap.get('client_name')}`;
        }
      },
      { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
    ]
  },
  {
    path: 'analytic/:user',
    component: AnalyticView,
    title: 'Action Utilisateur'
  },
  {
    path: 'home',
    component: DashboardComponent,
    title: 'Page d\'accueil'
  },
  {
    path: 'deploiment',
    component: DeploimentComponent,
    title: 'Déploiement'
  },
  {
    path: 'architecture',
    component: ArchitectureView,
    title: 'Architecture'
  },
  { path: '**', pathMatch: 'full', redirectTo: `/home` }
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
      SizePipe,
    DatePipe,
    DecimalPipe,
    DurationPipe,
    I18nPluralPipe,
    EnvRouter,
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    NumberFormatterPipe,
    {provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
