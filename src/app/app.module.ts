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
import {SearchRequestView} from "./views/search/request/search-request.view";
import {Constants} from "./views/constants";
import {DetailRequestView} from "./views/detail/request/detail-request.view";
import {ServerSupervisionView} from "./views/supervision/_component/server/server-supervision.view";
import {ClientSupervisionView} from "./views/supervision/_component/client/client-supervision.view";


registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
    {
      path:'request', children : [
        {
          path:':type',
          children: [
            {
              path: '',
              component: SearchRequestView,
              title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => 'Requêtes '+ Constants.REQUEST_MAPPING_TYPE[route.paramMap.get('type')].title,
            },
            {
              path: ':id_request',
              component: DetailRequestView,
              title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                return 'Appel d\'API > Detail ' + Constants.REQUEST_MAPPING_TYPE[route.paramMap.get('type')].title
              }
            }
          ]
        },
        { path: '**', pathMatch: 'full', redirectTo: `/request/rest` }
      ]
    },
    {
    path: 'session', children: [
      {
        path: ':app_name/dump',
        component: DumpView,
        title: 'Pulse'
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
                path: 'tree',
                data: { type: 'rest' },
                component: TreeView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                    return `Lancement d'appel Rest > Arbre d'Appels`;
                }
              },
              { path: '**', pathMatch: 'full', redirectTo: `/session/rest/:id_session` }
            ]
          },
          { path: '**', pathMatch: 'full', redirectTo: `/session/rest` }
        ]
      },
      {
        path: ':type_main',
        children: [
          {
            path: '',
            component: SearchMainView,
            title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
              if (route.paramMap.get('type_main') == 'batch') {
                return 'Exécution de Batch';
              } else if(route.paramMap.get('type_main') == 'startup') {
                return 'Lancement de Serveur';
              } else if (route.paramMap.get('type_main') == 'test') {
                return 'Exécution de Test';
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
                    return `Exécution de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'test') {
                    return `Exécution de Test ${detail}`;
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
                    return `Exécution de Batch ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'startup') {
                    return `Lancement de Serveur ${detail}`;
                  } else if (route.paramMap.get('type_main') == 'test') {
                    return `Exécution de Test ${detail}`;
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
    title: 'Parcours Utilisateur'
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
  {
    path: 'supervision/server/:instance',
    component: ServerSupervisionView,
    title: 'Server Supervision'
  },
  {
    path: 'supervision/client/:instance',
    component: ClientSupervisionView,
    title: 'Client Supervision'
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
