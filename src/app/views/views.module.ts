import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../shared/shared.module';
import { MaterialModule } from '../app.material.module';
import { SessionApiComponent } from './session-api/session-api.component';
import { SessionMainComponent } from './session-main/session-main.component';
import { TreeComponent } from './tree/tree.component';
import { DependenciesTableComponent } from '../shared/components/stats/dependencies-table/dependencies-table.component';
import { DependentsTableComponent } from '../shared/components/stats/dependents-table/dependents-table.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { StatsDatabaseComponent } from './stats-database/stats-database.component';
import { SessionTableComponent } from '../shared/components/stats/session-table/session-table.component';
import { StatsAppComponent } from './stats-app/stats-app.component';
import { StatsApiComponent } from './stats-api/stats-api.component';
import { StatsUserComponent } from './stats-user/stats-user.component';
import { ExceptionTableComponent } from '../shared/components/stats/exception-table/exception-table.component';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { DbRequestDetailComponent } from './db-request-detail/db-request-detail.component';
import { RequestRestTableComponent } from './session-detail/components/request-rest-table/request-rest-table.component';
import { RequestDatabaseTableComponent } from './session-detail/components/request-database-table/request-database-table.component';
import { RequestTimelineComponent } from './session-detail/components/request-timeline/request-timeline.component';

@NgModule({
  imports: [
    MaterialModule,
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
    SessionApiComponent,
    SessionDetailComponent,
    RequestRestTableComponent,
    RequestDatabaseTableComponent,
    RequestTimelineComponent,
    SessionMainComponent,
    StatsAppComponent,
    StatsApiComponent,
    StatsUserComponent,
    TreeComponent,
    StatsDatabaseComponent,
    DependentsTableComponent,
    DependenciesTableComponent,
    ExceptionTableComponent,
    SessionTableComponent,
    DbRequestDetailComponent
  ]
})
export class ViewsModule { }
