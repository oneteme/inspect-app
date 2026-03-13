import {Component, inject, Input} from "@angular/core";
import {TableProvider} from '@oneteme/jquery-table';
import {LogEntry} from "../../../../model/trace.model";
import {StacktraceDialogComponent} from "../../exception-display/stacktrace-dialog/stacktrace-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {LOG_TABLE_CONFIG} from "../table.config";

@Component({
  selector: 'log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.scss']
})
export class LogTableComponent {
  private readonly _dialog = inject(MatDialog);
  tableConfig: TableProvider<LogEntry> = LOG_TABLE_CONFIG;

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