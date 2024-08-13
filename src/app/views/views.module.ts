import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {MainComponent as SearchMainComponent} from './search/main/main.component';
import {MainComponent as DetailSessionMainComponent} from './detail/session/main/main.component';
import {TreeComponent} from './tree/tree.component';
import {DependenciesTableComponent} from './statistic/_component/dependencies-table/dependencies-table.component';
import {DependentsTableComponent} from './statistic/_component/dependents-table/dependents-table.component';
import {SessionTableComponent} from './statistic/user/_component/session-table/session-table.component';
import {ApplicationComponent} from './statistic/application/application.component';
import {RestComponent as SearchRestComponent} from './search/rest/rest.component';
import {RestComponent as StatisticRestComponent} from './statistic/rest/rest.component';
import {RestComponent as DetailSessionRestComponent} from './detail/session/rest/rest.component';
import {UserComponent} from './statistic/user/user.component';
import {ExceptionTableComponent} from './statistic/_component/exception-table/exception-table.component';
import {ChartComponent} from '@oneteme/jquery-apexcharts';
import {DatabaseComponent as StatisticDatabaseComponent} from './statistic/database/database.component';
import {DatabaseComponent as DetailDatabaseComponent} from './detail/database/database.component';
import {RestTableComponent} from './detail/session/_component/rest-table/rest-table.component';
import {DatabaseTableComponent} from './detail/session/_component/database-table/database-table.component';
import {TimelineComponent} from './detail/session/_component/timeline/timeline.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {FtpTableComponent} from "./detail/session/_component/ftp-table/ftp-table.component";
import {SmtpTableComponent} from "./detail/session/_component/smtp-table/smtp-table.component";
import {LdapTableComponent} from "./detail/session/_component/ldap-table/ldap-table.component";
import {FtpComponent as DetailFtpComponent} from "./detail/ftp/ftp.component";
import {LdapComponent as DetailLdapComponent} from "./detail/ldap/ldap.component";
import {SmtpComponent as DetailSmtpComponent} from "./detail/smtp/smtp.component";

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
    SearchRestComponent,
    SearchMainComponent,
    StatisticRestComponent,
    StatisticDatabaseComponent,
    DetailSessionRestComponent,
    DetailSessionMainComponent,
    DetailDatabaseComponent,
    DetailFtpComponent,
    DetailLdapComponent,
    DetailSmtpComponent,
    RestTableComponent,
    DatabaseTableComponent,
    FtpTableComponent,
    SmtpTableComponent,
    LdapTableComponent,
    TimelineComponent,
    ApplicationComponent,
    UserComponent,
    TreeComponent,
    DependentsTableComponent,
    DependenciesTableComponent,
    ExceptionTableComponent,
    SessionTableComponent,
    DashboardComponent
  ]
})
export class ViewsModule { }
