import {Component, EventEmitter, Input, Output} from "@angular/core";
import {DatabaseRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {DATABASE_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'database-table',
  templateUrl: './detail-database-table.component.html',
  styleUrls: ['./detail-database-table.component.scss']
})
export class DetailDatabaseTableComponent {
  tableConfig: TableProvider<DatabaseRequestDto> = {
    ...DATABASE_REQUEST_TABLE_CONFIG,
    onRowSelected: (row, event) => this.selectedQuery(event, row.id)
  };

  _requests: DatabaseRequestDto[] = [];

  @Input() set requests(requests: DatabaseRequestDto[]) {
    this._requests = requests;
  }
  @Input() set initialSearch(value: string) {
    this.tableConfig = {
      ...this.tableConfig,
      search: { ...this.tableConfig?.search, initialQuery: value }
    }
  }
  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();

  selectedQuery(event: MouseEvent, row: string) {
    this.onClickRow.emit({event: event, row: row});
  }
}
