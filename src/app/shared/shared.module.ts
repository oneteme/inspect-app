import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from './components/header-page/header-page.component';
import { MaterialModule } from '../app.material.module';
import { FilterRowPipe } from './pipe/filter-row.pipe';
import { AdvancedFilterTriggerComponent } from './components/stats/advanced-filter/advanced-filter-trigger/advanced-filter-trigger.component';
import { AdvancedFilterRecapComponent } from './components/stats/advanced-filter/advanced-filter-recap/advanced-filter-recap.component';
import { AdvancedFilterComponent } from './components/stats/advanced-filter/advanced-filter-modal/advanced-filter-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DurationPipe } from './pipe/duration.pipe';
import { SizePipe } from './pipe/size.pipe';

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
    SizePipe
  ],
  exports: [
    HeaderPageComponent,
    AdvancedFilterComponent,
    AdvancedFilterRecapComponent,
    AdvancedFilterTriggerComponent,
    DurationPipe,
    SizePipe
  ]
})
export class SharedModule { }
