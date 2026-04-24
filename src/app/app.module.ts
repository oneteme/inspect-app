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
import {DashboardComponent} from "./views/dashboard/dashboard.component";
import {EnvRouter} from "./service/router.service";
import {DurationPipe} from "./shared/pipe/duration.pipe";
import {ArchitectureView} from "./views/architecture/architecture.view";
import {NumberFormatterPipe} from './shared/pipe/number.pipe';
import {TreeView} from './views/tree/tree.view';
import {SizePipe} from "./shared/pipe/size.pipe";
import {DeploimentComponent} from './views/deploiment/deploiment.component';
import {Interceptor} from "./shared/interceptor/interceptor";
import {AnalyticView} from "./views/analytic/analytic.view";
import {SearchRequestView} from "./views/search/request/search-request.view";
import {Constants} from "./views/constants";
import {DetailRequestView} from "./views/detail/request/detail-request.view";
import {InstanceComponent} from './views/detail/instance/instance.component';
import {NavbarComponent} from './components/navbar/navbar.component';
import {ServerSupervisionView} from "./views/supervision/_component/server/server-supervision.view";
import {ClientSupervisionView} from "./views/supervision/_component/client/client-supervision.view";
import {RequestKpiView} from "./views/kpi/request/request-kpi.view";
import {SessionKpiView} from "./views/kpi/session/session-kpi.view";

registerLocaleData(localeFr, 'fr-FR');
const routes: Route[] = [
  {
    path: 'request', children: [
      {
        path: ':type',
        children: [
          {
            path: '',
            component: SearchRequestView,
            title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => Constants.MAPPING_TYPE['request'].title + ' ' + Constants.REQUEST_MAPPING_TYPE[route.paramMap.get('type')].title + ' > Recherche',
          },
          {
            path: ':id_request',
            component: DetailRequestView,
            title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
              return Constants.MAPPING_TYPE['request'].title + ' ' + Constants.REQUEST_MAPPING_TYPE[route.paramMap.get('type')].title + ' > Detail'
            }
          }
        ]
      },
      {path: '**', pathMatch: 'full', redirectTo: `/request/rest`}
    ]
  },
  {
    path: 'session', children: [
      {
        path: 'rest',
        children: [
          {
            path: '',
            component: SearchRestView,
            title: Constants.MAPPING_TYPE['rest'].title + ' > Recherche'

          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionRestView,
                title: Constants.MAPPING_TYPE['rest'].title + ' > Detail'
              },
              {
                path: 'tree',
                data: {type: 'rest'},
                component: TreeView,
                title: Constants.MAPPING_TYPE['rest'].title + ` > Arbre d'Appels`
              },
              {path: '**', pathMatch: 'full', redirectTo: `/session/rest/:id_session`}
            ]
          },
          {path: '**', pathMatch: 'full', redirectTo: `/session/rest`}
        ]
      },
      {
        path: ':type_main',
        children: [
          {
            path: '',
            component: SearchMainView,
            title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
              return Constants.MAPPING_TYPE[route.paramMap.get('type_main')].title + ' > Recherche';
            }
          },
          {
            path: ':id_session',
            children: [
              {
                path: '',
                component: DetailSessionMainView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  return Constants.MAPPING_TYPE[route.paramMap.get('type_main')].title + ' > Detail';
                }
              },
              {
                path: 'tree',
                data: {type: 'main'},
                component: TreeView,
                title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
                  return Constants.MAPPING_TYPE[route.paramMap.get('type_main')].title + ' > Arbre d\'Appels';
                }
              },
              {path: '**', pathMatch: 'full', redirectTo: `/main/:type_main/:id_session`}
            ]
          },
          {path: '**', pathMatch: 'full', redirectTo: `/main/:type_main`}
        ]
      },
      {path: '**', pathMatch: 'full', redirectTo: `/session/rest`}
    ]
  },
  {
    path: 'instance',
    children: [
      {
        path: 'detail/:id_instance',
        component: InstanceComponent,
        title: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
          return `instance > ${route.paramMap.get('id_instance')}`;
        }
      },
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
    title: 'Instances Actives'
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
    path: 'kpi/request/:request_type',
    component: RequestKpiView,
    title:  (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      return Constants.MAPPING_TYPE['request'].title + ' ' + Constants.REQUEST_MAPPING_TYPE[route.paramMap.get('request_type')].title + ' > Tableau de bord';
    }
  },
  {
    path: 'kpi/session/:session_type',
    component: SessionKpiView,
    title:  (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      return Constants.MAPPING_TYPE[route.paramMap.get('session_type')].title + ' > Tableau de bord';
    }
  },
  {
    path: 'supervision/client/:instance',
    component: ClientSupervisionView,
    title: 'Client Supervision'
  },
  {path: '**', pathMatch: 'full', redirectTo: `/home`}
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {useHash: true}),
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedModule,
    ViewsModule
  ],
  declarations: [
    AppComponent,
    NavbarComponent
  ],
  providers: [
    SizePipe,
    DatePipe,
    DecimalPipe,
    DurationPipe,
    I18nPluralPipe,
    EnvRouter,
    {provide: LOCALE_ID, useValue: 'fr-FR'},
    NumberFormatterPipe,
    {provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
