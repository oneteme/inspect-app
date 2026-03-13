import {Component, inject, Input} from "@angular/core";
import {TableProvider} from '@oneteme/jquery-table';
import {LogEntry} from "../../../model/trace.model";
import {StacktraceDialogComponent} from "../exception-display/stacktrace-dialog/stacktrace-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.scss']
})
export class LogTableComponent {
  private readonly _dialog = inject(MatDialog);
  tableConfig: TableProvider<LogEntry> = {
    columns: [
      { key: 'message', header: 'Message', icon: 'chat', sliceable: false, groupable: false },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'action', header: 'Action', icon: 'touch_app', sliceable: false, groupable: false, sortable: false }
    ],
    slices: [
      {
        title: 'Type de log',
        columnKey: 'level',
        icon: 'label'
      }
    ],
    defaultSort: { active: 'start', direction: 'desc' },
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

  open(row: any) {
    this._dialog.open(StacktraceDialogComponent, {
      data: { message: row.message, stackTraceRows: row.stackRows }
    });
  }
}