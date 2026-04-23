import {Component, EventEmitter, Input, Output} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {TableProvider} from "@oneteme/jquery-table";
import {RestSessionDto} from "../../../../model/request.model";
import {DEFAULT_TABLE_CONFIG} from "../../../../shared/_component/table/table.config";

@Component({
  selector: 'dependent-new-table',
  templateUrl: './dependent-table.component.html',
  styleUrls: ['./dependent-table.component.scss']
})
export class DependentNewTableComponent {
  tableConfig: TableProvider<RestSessionDto> = {
    ...DEFAULT_TABLE_CONFIG,
    search: {enabled: false},
    view: {enabled: false},
    export: {enabled: false},
    preferences: {enabled: false},
    columns: [
      { key: 'actual', header: 'Hôte', icon: 'dns', sliceable: false },
      { key: 'dep', header: 'Hôte appelé', icon: 'dns', groupable: false, sliceable: false },
      { key: 'stats',      header: 'Statuts',        icon: 'bar_chart', sortable: false, groupable: false, sliceable: false,
        searchValue: (row) => `${row.countSucces} ${row.countErrClient} ${row.countErrServer}`
      }
    ],
    onRowSelected: (row, event) => this.onRowSelected.emit({row: row, event: event}),
    defaultGroupBy: 'actual'
  };

  @Input() queryParams: QueryParams;
  @Input() loading: boolean;
  @Input() data: any[];

  @Output() onRowSelected = new EventEmitter<{row, event: MouseEvent}>();
}