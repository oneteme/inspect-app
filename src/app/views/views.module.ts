import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {ChartComponent} from "@oneteme/jquery-apexcharts";
import {SearchRestView} from "./search/rest/search-rest.view";
import {SearchMainView} from "./search/main/search-main.view";
import {StatisticRestView} from "./statistic/rest/statistic-rest.view";
import {StatisticDatabaseView} from "./statistic/database/statistic-database.view";
import {DetailSessionRestView} from "./detail/session/rest/detail-session-rest.view";
import {DetailSessionMainView} from "./detail/session/main/detail-session-main.view";
import {DetailDatabaseView} from "./detail/database/detail-database.view";
import {DetailFtpView} from "./detail/ftp/detail-ftp.view";
import {DetailLdapView} from "./detail/ldap/detail-ldap.view";
import {DetailSmtpView} from "./detail/smtp/detail-smtp.view";
import {DetailRestTableComponent} from "./detail/session/_component/rest-table/detail-rest-table.component";
import {DetailDatabaseTableComponent} from "./detail/session/_component/database-table/detail-database-table.component";
import {DetailFtpTableComponent} from "./detail/session/_component/ftp-table/detail-ftp-table.component";
import {DetailSmtpTableComponent} from "./detail/session/_component/smtp-table/detail-smtp-table.component";
import {DetailLdapTableComponent} from "./detail/session/_component/ldap-table/detail-ldap-table.component";
import {DetailTimelineComponent} from "./detail/session/_component/timeline/detail-timeline.component";
import {DetailSessionComponent} from "./detail/session/_component/detail-session.component";
import {StatisticApplicationView} from "./statistic/application/statistic-application.view";
import {StatisticUserView} from "./statistic/user/statistic-user.view";
import {TreeView} from "./tree/tree.view";
import {
  StatisticDependentsTableComponent
} from "./statistic/_component/dependents-table/statistic-dependents-table.component";
import {
  StatisticDependenciesTableComponent
} from "./statistic/_component/dependencies-table/statistic-dependencies-table.component";
import {
  StatisticExceptionTableComponent
} from "./statistic/_component/exception-table/statistic-exception-table.component";
import {
  StatisticUserSessionTableComponent
} from "./statistic/user/_component/session-table/statistic-user-session-table.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import { ProtocolExceptionComponent } from './dashboard/components/protocol-exception-modal/protocol-exception-modal.component';
import {ServerHistoryTableComponent} from "./statistic/application/history-table/server-history-table.component";
import { NewTreeView } from './newtree/newtree.view';

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
    DashboardComponent,
    ProtocolExceptionComponent,
    ServerHistoryTableComponent,
    NewTreeView
  ]
})
export class ViewsModule { }
