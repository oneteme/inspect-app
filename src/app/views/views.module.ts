import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {ChartComponent} from "@oneteme/jquery-echarts";
import {OrganizerButtonModule} from "@oneteme/jquery-organizer";
import {SearchRestView} from "./search/rest/search-rest.view";
import {SearchMainView} from "./search/main/search-main.view";
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
import {TreeView} from "./tree/tree.view";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {
  ProtocolExceptionComponent
} from './dashboard/components/protocol-exception-modal/protocol-exception-modal.component';
import {ArchitectureView} from "./architecture/architecture.view";
import {DetailLocalTableComponent} from "./detail/session/_component/local-table/detail-local-table.component";
import {NumberFormatterPipe, CompactNumberPipe} from '../shared/pipe/number.pipe';
import {SearchRequestView} from "./search/request/search-request.view";
import {AnalyticView} from "./analytic/analytic.view";
import {DetailTimelineComponent} from "./detail/session/_component/timeline/detail-timeline.component";
import {ActionTableComponent} from "./detail/session/_component/action-table/action-table.component";
import {DetailRequestView} from "./detail/request/detail-request.view";
import {DetailRestView} from "./detail/request/rest/detail-rest.view";
import {MailTableComponent} from "./detail/request/smtp/_component/mail-table/mail-table.component";
import {
  ServerInstanceSelectorDialogComponent
} from "./supervision/_component/server/server-instance-selector-dialog/server-instance-selector-dialog.component";
import {ServerSupervisionView} from "./supervision/_component/server/server-supervision.view";
import {ClientSupervisionView} from "./supervision/_component/client/client-supervision.view";
import {
  ClientInstanceSelectorDialogComponent
} from "./supervision/_component/client/client-instance-selector-dialog/client-instance-selector-dialog.component";
import {InstanceComponent} from './detail/instance/instance.component';
import {InstanceTableComponent} from './detail/instance/_component/instance-table/instance-table.component';
import {ParameterTableComponent} from "./detail/instance/_component/parameter-table/parameter-table.component";
import {DashboardInstancesTableComponent} from './dashboard/components/instances-table/instances-table.component';
import {DashboardDetailViewComponent} from './dashboard/components/detail-view/detail-view.component';
import {RequestKpiView} from "./kpi/request/request-kpi.view";
import {RequestKpiTestView} from "./kpi-test/request/request-kpi-test.view";
import {RestKpiTestComponent} from "./kpi-test/request/rest/rest.component";
import {RestComponent as RequestRestComponent} from "./kpi/request/rest/rest.component";
import {RestComponent as SessionRestComponent} from "./kpi/session/rest/rest.component";
import {StatusChartComponent} from "./kpi/_component/status-chart/status-chart.component";
import {PerformanceChartComponent} from "./kpi/_component/performance-chart/performance-chart.component";
import {VolumetryChartComponent} from "./kpi/_component/volumetry-chart/volumetry-chart.component";
import {ChartMenuComponent} from "./kpi/_component/chart-menu/chart-menu.component";
import {LatencyChartComponent} from "./kpi/_component/latency-chart/latency-chart.component";
import {SlicePanelComponent} from "@oneteme/jquery-organizer";
import {TableComponent} from "@oneteme/jquery-table";
import {JdbcComponent} from "./kpi/request/jdbc/jdbc.component";
import {FtpComponent} from "./kpi/request/ftp/ftp.component";
import {LdapComponent} from "./kpi/request/ldap/ldap.component";
import {SmtpComponent} from "./kpi/request/smtp/smtp.component";
import {SessionKpiView} from "./kpi/session/session-kpi.view";
import {BatchComponent} from "./kpi/session/batch/batch.component";
import {CommandChartComponent} from "./kpi/_component/command-chart/command-chart.component";
import {DependencyChartComponent} from "./kpi/_component/dependency-chart/dependency-chart.component";
import {MediaTypeChartComponent} from "./kpi/_component/media-type-chart/media-type-chart.component";
import {DependentChartComponent} from "./kpi/_component/dependent-chart/dependent-chart.component";
import {StartupComponent} from "./kpi/session/startup/startup.component";
import {UserChartComponent} from "./kpi/_component/user-chart/user-chart.component";
import {CompareView} from "./compare/compare.view";

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    ChartComponent,
    SlicePanelComponent,
    TableComponent,
    OrganizerButtonModule
  ],
  declarations: [
    SearchRestView,
    SearchMainView,
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
    DashboardComponent,
    ProtocolExceptionComponent,
    ArchitectureView,
    TreeView,
    NumberFormatterPipe,
    CompactNumberPipe,
    AnalyticView,
    ActionTableComponent,
    SearchRequestView,
    MailTableComponent,
    ServerInstanceSelectorDialogComponent,
    ClientInstanceSelectorDialogComponent,
    ServerSupervisionView,
    ClientSupervisionView,
    InstanceComponent,
    InstanceTableComponent,
    ParameterTableComponent,
    DashboardInstancesTableComponent,
    DashboardDetailViewComponent,

    // New
    RequestKpiView,
    RequestKpiTestView,
    RestKpiTestComponent,
    RequestRestComponent,
    SessionRestComponent,
    BatchComponent,
    StartupComponent,
    JdbcComponent,
    FtpComponent,
    LdapComponent,
    SmtpComponent,
    StatusChartComponent,
    PerformanceChartComponent,
    VolumetryChartComponent,
    LatencyChartComponent,
    ChartMenuComponent,
    SessionKpiView,
    CommandChartComponent,
    DependencyChartComponent,
    DependentChartComponent,
    MediaTypeChartComponent,
    UserChartComponent,
    CompareView
  ]
})
export class ViewsModule { }
