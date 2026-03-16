import {Component, Input, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {LastServerStart} from "../../../../../model/jquery.model";
import {TableProvider} from "../../../../../../../../../jarvis/jquery-charts/dist/oneteme/jquery-table";
import {DEFAULT_SORT_CONFIG, DEFAULT_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";



@Component({
  selector: 'parameter-table',
  templateUrl: './parameter-table.component.html',
  styleUrls: ['./parameter-table.component.scss']
})
export class ParameterTableComponent {
  readonly tableConfig: TableProvider<{ key: string; value: any }> = {
    ...DEFAULT_TABLE_CONFIG,
    view: { enabled: false },
    columns: [
      { key: 'key', header: 'Paramètre', icon: 'vpn_key' },
      { key: 'value',  header: 'Valeur', icon: 'input',
        value: (row: { key: string; value: any }) => this.formatValue(row.key, row.value)
      }
    ]
  };


  UNIT_MAP: Record<string, string> = {
    minHeap: 'Mo',
    maxHeap: 'Mo',
    diskTotalSpace: 'Mo',
  };

  _requests: { key: string; value: any }[] = [];

  @Input() set data(requests: { key: string; value: any }[]) {
    if(requests) {
      this._requests = requests;
    }
  }

  formatValue(key : string, value : string){
    const unit  = this.UNIT_MAP[key];
    return unit ? `${value} ${unit}` : value;
  }
}