import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {StackTraceRow} from "../../../../model/trace.model";

  type StackRows = StackTraceRow[] | string | null;

@Component({
  selector: 'app-stacktrace-dialog',
  templateUrl: './stacktrace-dialog.component.html',
  styleUrls: ['./stacktrace-dialog.component.scss']
})
export class StacktraceDialogComponent {
  _stacktrace: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      type: string;
      message: string;
      stackRows?: StackRows;
      stackTraceRows?: StackRows;
    }
  ) {
    this._stacktrace = this.stacktraceFormatter(data.message, data.stackRows ?? data.stackTraceRows ?? null);
  }

  stacktraceFormatter(message: string, stackRows: StackRows): string | null {
    const rows = this.parseStackRows(stackRows);
    const frames = rows.map(row => '  at ' + row.className + '.' + row.methodName +
        '(' + this.getFileName(row) + ':' + row.lineNumber + ')');
    return [message, frames.join('\n')].filter(Boolean).join('\n') || null;
  }

  private parseStackRows(value: StackRows): StackTraceRow[] {
    if (!value) return [];

    let rows: unknown;
    if (typeof value === 'string') {
      try {
        rows = JSON.parse(value);
      } catch {
        return [];
      }
    } else {
      rows = value;
    }

    if (!Array.isArray(rows)) return [];
    return rows.reduce<StackTraceRow[]>((validRows, row: unknown) => {
      if (!row || typeof row !== 'object') return validRows;
      const frame = row as Record<string, unknown>;
      const lineNumber = Number(frame.lineNumber);
      if (typeof frame.className === 'string' && typeof frame.methodName === 'string' &&
          Number.isFinite(lineNumber)) {
        validRows.push({className: frame.className, methodName: frame.methodName, lineNumber});
      }
      return validRows;
    }, []);
  }

  getFileName(row: StackTraceRow): string {
    const start = row.className.lastIndexOf('.') + 1;
    const innerClass = row.className.indexOf('$');
    return row.className.substring(start, innerClass > -1 ? innerClass : row.className.length) + '.java';
  }
}

