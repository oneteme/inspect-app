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
import {StatisticDatabaseView} from "./statistic/database/statistic-database.view";
import {DetailSessionRestView} from "./detail/session/rest/detail-session-rest.view";
import {DetailSessionMainView} from "./detail/session/main/detail-session-main.view";
import {DetailDatabaseView} from "./detail/request/database/detail-database.view";
import {DetailFtpView} from "./detail/request/ftp/detail-ftp.view";
import {DetailLdapView} from "./detail/request/ldap/detail-ldap.view";
import {DetailSmtpView} from "./detail/request/smtp/detail-smtp.view";
import {DetailRestTableComponent} from "./detail/session/_component/rest-table/detail-rest-table.component";
import {DetailDatabaseTableComponent} from "./detail/session/_component/database-table/detail-database-table.component";
import {DetailFtpTableComponent} from "./detail/session/_component/ftp-table/detail-ftp-table.component";
import {DetailSmtpTableComponent} from "./detail/session/_component/smtp-table/detail-smtp-table.component";
import {DetailLdapTableComponent} from "./detail/session/_component/ldap-table/detail-ldap-table.component";
import {DetailSessionComponent} from "./detail/session/_component/detail-session.component";
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
import {DashboardComponent} from "./dashboard/dashboard.component";
import {
    ProtocolExceptionComponent
} from './dashboard/components/protocol-exception-modal/protocol-exception-modal.component';
import {StatisticClientView} from "./statistic/view/statistic-client.view";
import {ArchitectureView} from "./architecture/architecture.view";
import {DetailLocalTableComponent} from "./detail/session/_component/local-table/detail-local-table.component";
import {DumpView} from "./dump/dump.view";
import { NumberFormatterPipe } from '../shared/pipe/number.pipe';
import { DeploimentComponent } from './deploiment/deploiment.component';
import {StatisticServerView} from "./statistic/server/statistic-server.view";
import {RestTabComponent} from "./statistic/server/_component/rest-tab/rest-tab.component";
import {BatchTabComponent} from "./statistic/server/_component/batch-tab/batch-tab.component";
import {DependencyTableComponent} from "./statistic/server/_component/dependency-table/dependency-table.component";
import {ExceptionsTableComponent} from "./statistic/server/_component/exceptions-table/exceptions-table.component";
import {EvolUserCardComponent} from "./statistic/server/_component/evol-user-card/evol-user-card.component";
import {PerformanceCardComponent} from "./statistic/server/_component/performance-card/performance-card.component";
import {DependencyCardComponent} from "./statistic/server/_component/dependency-card/dependency-card.component";
import {ServerStartTableComponent} from "./dashboard/components/server-start-table/server-start-table.component";
import {
  RepartitionTypeCardComponent as RestRepartitionTypeCardComponent
} from "./statistic/server/_component/rest-tab/_component/repartition-type-card/repartition-type-card.component";
import {
  RepartitionTypeCardComponent as BatchRepartitionTypeCardComponent
} from "./statistic/server/_component/batch-tab/_component/repartition-type-card/repartition-type-card.component";
import {SearchRequestView} from "./search/request/search-request.view";
import {AnalyticView} from "./analytic/analytic.view";
import {DetailTimelineComponent} from "./detail/session/_component/timeline/detail-timeline.component";
import {ActionTableComponent} from "./detail/session/_component/action-table/action-table.component";
import {DetailRequestView} from "./detail/request/detail-request.view";
import {DetailRestView} from "./detail/request/rest/detail-rest.view";
import {SupervisionView} from "./supervision/supervision.view";
import {StacktraceDialogComponent} from "./supervision/_component/stacktrace-dialog/stacktrace-dialog.component";
import {ConfigDialogComponent} from "./supervision/_component/config-dialog/config-dialog.component";
import {StageDialogComponent} from "./detail/session/rest/stage-dialog/stage-dialog.component";



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
    StatisticDatabaseView,
    DetailRequestView,
    DetailSessionRestView,
    DetailSessionMainView,
    DetailRestView,
    DetailDatabaseView,
    DetailFtpView,
    DetailLdapView,
    DetailSmtpView,
    DetailRestTableComponent,
    DetailDatabaseTableComponent,
    DetailFtpTableComponent,
    DetailSmtpTableComponent,
    DetailLdapTableComponent,
    DetailLocalTableComponent,
    DetailTimelineComponent,
    DetailSessionComponent,
    StatisticUserView,
    StatisticDependentsTableComponent,
    StatisticDependenciesTableComponent,
    StatisticExceptionTableComponent,
    StatisticClientView,
    DashboardComponent,
    ProtocolExceptionComponent,
    ArchitectureView,
    TreeView,
    DumpView,
    SupervisionView,
    StatisticServerView,
    RestTabComponent,
    BatchTabComponent,
    DependencyTableComponent,
    ExceptionsTableComponent,
    BatchRepartitionTypeCardComponent,
    RestRepartitionTypeCardComponent,
    EvolUserCardComponent,
    PerformanceCardComponent,
    DependencyCardComponent,
    ServerStartTableComponent,
    NumberFormatterPipe,
    DeploimentComponent,
    AnalyticView,
    ActionTableComponent,
    SearchRequestView,
    StacktraceDialogComponent,
    ConfigDialogComponent,
    StageDialogComponent
  ]
})
export class ViewsModule { }
