import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from './_component/header-page/header-page.component';
import { MaterialModule } from './material/material.module';
import { FilterRowPipe } from './pipe/filter-row.pipe';
import { AdvancedFilterTriggerComponent } from './_component/advanced-filter/advanced-filter-trigger/advanced-filter-trigger.component';
import { AdvancedFilterRecapComponent } from './_component/advanced-filter/advanced-filter-recap/advanced-filter-recap.component';
import { AdvancedFilterComponent } from './_component/advanced-filter/advanced-filter-modal/advanced-filter-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DurationPipe } from './pipe/duration.pipe';
import { SizePipe } from './pipe/size.pipe';
import {TitleCasePipe} from "./pipe/title-case.pipe";
import {ExceptionTypePipe} from "./pipe/exception-type.pipe";
import {TruncStringPipe} from "./pipe/trunc-string.pipe";
import {TimelineComponent} from "./_component/timeline/timeline.component";
import {HeaderSectionComponent} from "./_component/header-section/header-section.component";
import {TypeColumnFormatPipe} from "./pipe/type-column-format";
import {ExceptionDisplayComponent} from "./_component/exception-display/exception-display.component";
import { StacktraceDialogComponent } from './_component/exception-display/stacktrace-dialog/stacktrace-dialog.component';
import {VersionBadgeComponent} from "./_component/version-badge/version-badge.component";
import {StatusIndicatorComponent} from "./_component/status-indicator/status-indicator.component";
import {ServerCardComponent} from "./_component/server-card/server-card.component";
import {OverlayContainerFilterComponent} from "./_component/overlay-container-filter/overlay-container-filter.component";
import {BranchHashBadgeComponent} from "./_component/branch-hash-badge/branch-hash-badge.component";

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }
  }
};

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    HeaderPageComponent,
    AdvancedFilterComponent,
    AdvancedFilterRecapComponent,
    AdvancedFilterTriggerComponent,
    FilterRowPipe,
    DurationPipe,
    SizePipe,
    TitleCasePipe,
    ExceptionTypePipe,
    TruncStringPipe,
    TypeColumnFormatPipe,
    TimelineComponent,
    HeaderSectionComponent,
    ExceptionDisplayComponent,
    StacktraceDialogComponent,
    VersionBadgeComponent,
    BranchHashBadgeComponent,
    StatusIndicatorComponent,
    ServerCardComponent,
    OverlayContainerFilterComponent
  ],
  exports: [
    MaterialModule,
    HeaderPageComponent,
    AdvancedFilterComponent,
    AdvancedFilterRecapComponent,
    AdvancedFilterTriggerComponent,
    DurationPipe,
    SizePipe,
    TitleCasePipe,
    ExceptionTypePipe,
    TruncStringPipe,
    TypeColumnFormatPipe,
    TimelineComponent,
    HeaderSectionComponent,
    ExceptionDisplayComponent,
    VersionBadgeComponent,
    BranchHashBadgeComponent,
    StatusIndicatorComponent,
    ServerCardComponent,
    OverlayContainerFilterComponent
  ]
})
export class SharedModule { }
