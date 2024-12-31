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
    TitleCasePipe
  ],
  exports: [
    MaterialModule,
    HeaderPageComponent,
    AdvancedFilterComponent,
    AdvancedFilterRecapComponent,
    AdvancedFilterTriggerComponent,
    DurationPipe,
    SizePipe,
    TitleCasePipe
  ]
})
export class SharedModule { }
