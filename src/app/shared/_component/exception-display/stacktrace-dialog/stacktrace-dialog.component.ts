import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {StackTraceRow} from "../../../../model/trace.model";

@Component({
  selector: 'app-stacktrace-dialog',
  templateUrl: './stacktrace-dialog.component.html',
  styleUrls: ['./stacktrace-dialog.component.scss']
})
export class StacktraceDialogComponent {
  _stacktrace: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: string, message: string, stackTraceRows: StackTraceRow[] }
  ) {
    this._stacktrace = this.stacktraceFormatter(data.message, data.stackTraceRows);
  }

  stacktraceFormatter(message: string, stackTraceRows: StackTraceRow[]) {
    return stackTraceRows ? `${message ? `${message} \n` : ''}  at ${stackTraceRows.map(d => `${d.className}.${d.methodName}(${this.getFileName(d)}:${d.lineNumber})`).join('\n  at ')}` : null;
  }

  getFileName(row: StackTraceRow): string {
    let bg = row.className.lastIndexOf('.') + 1;
    let to = row.className.indexOf('$');
    return row.className.substring(bg, to > -1 ? to : row.className.length) + ".java";
  }
}

