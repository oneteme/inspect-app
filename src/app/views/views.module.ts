import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {SearchMainView} from './search/main/search-main.view';
import {DetailSessionMainView} from './detail/session/main/detail-session-main.view';
import {TreeView} from './tree/tree.view';
import {
  StatisticDependenciesTableComponent
} from './statistic/_component/dependencies-table/statistic-dependencies-table.component';
import {
  StatisticDependentsTableComponent
} from './statistic/_component/dependents-table/statistic-dependents-table.component';
import {
  StatisticUserSessionTableComponent
} from './statistic/user/_component/session-table/statistic-user-session-table.component';
import {StatisticApplicationView} from './statistic/application/statistic-application.view';
import {SearchRestView} from './search/rest/search-rest.view';
import {StatisticRestView} from './statistic/rest/statistic-rest.view';
import {DetailSessionRestView} from './detail/session/rest/detail-session-rest.view';
import {StatisticUserView} from './statistic/user/statistic-user.view';
import {
  StatisticExceptionTableComponent
} from './statistic/_component/exception-table/statistic-exception-table.component';
import {ChartComponent} from '@oneteme/jquery-apexcharts';
import {StatisticDatabaseView} from './statistic/database/statistic-database.view';
import {DetailDatabaseView} from './detail/database/detail-database.view';
import {DetailRestTableComponent} from './detail/session/_component/rest-table/detail-rest-table.component';
import {DetailDatabaseTableComponent} from './detail/session/_component/database-table/detail-database-table.component';
import {DetailTimelineComponent} from './detail/session/_component/timeline/detail-timeline.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {DetailFtpTableComponent} from "./detail/session/_component/ftp-table/detail-ftp-table.component";
import {DetailSmtpTableComponent} from "./detail/session/_component/smtp-table/detail-smtp-table.component";
import {DetailLdapTableComponent} from "./detail/session/_component/ldap-table/detail-ldap-table.component";
import {DetailFtpView} from "./detail/ftp/detail-ftp.view";
import {DetailLdapView} from "./detail/ldap/detail-ldap.view";
import {DetailSmtpView} from "./detail/smtp/detail-smtp.view";
import {DetailSessionComponent} from "./detail/session/_component/detail-session.component";

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule, 
    ChartComponent
  ],
  declarations: [
    SearchRestView,
    SearchMainView,
    StatisticRestView,
    StatisticDatabaseView,
    DetailSessionRestView,
    DetailSessionMainView,
    DetailDatabaseView,
    DetailFtpView,
    DetailLdapView,
    DetailSmtpView,
    DetailRestTableComponent,
    DetailDatabaseTableComponent,
    DetailFtpTableComponent,
    DetailSmtpTableComponent,
    DetailLdapTableComponent,
    DetailTimelineComponent,
    DetailSessionComponent,
    StatisticApplicationView,
    StatisticUserView,
    TreeView,
    StatisticDependentsTableComponent,
    StatisticDependenciesTableComponent,
    StatisticExceptionTableComponent,
    StatisticUserSessionTableComponent,
    DashboardComponent
  ]
})
export class ViewsModule { }
