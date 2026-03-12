import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {LogEntry} from "../../../../../model/trace.model";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'log-table',
  templateUrl: './detail-log-table.component.html',
  styleUrls: ['./detail-log-table.component.scss']
})
export class DetailLogTableComponent {
  tableConfig: TableProvider<LogEntry> = {
    columns: [
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'message', header: 'Message', icon: 'chat', sliceable: false, groupable: false },
      { key: 'action', header: 'Action' }
    ],
    enableSearchBar: true,
    enableViewButton: true,
    allowColumnRemoval: true,
    enablePagination: true,
    pageSize: 10,
    enableColumnDragDrop: false,
    pageSizeOptions: [5, 10, 15, 20, 100],
    pageSizeOptionsGroupBy: [20, 50, 100, 200],
    emptyStateLabel: 'Aucun résultat',
    loadingStateLabel: 'Chargement des requêtes...'
  };

  _requests: LogEntry[] = [];

  @Input() set requests(requests: LogEntry[]) {
    if (requests) {
      this._requests = requests;
    }
  }
}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "message") return row["message"] as string;
  if (columnName == "date") return row['instant'] as string;
  return row[columnName as keyof any] as string;
}