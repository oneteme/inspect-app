import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ExceptionInfo, StackTraceRow} from "../../../../model/trace.model";

interface StacktraceLine {
  text: string;
  hiddenFrames?: string[];
  expanded?: boolean;
}

@Component({
  selector: 'app-stacktrace-dialog',
  templateUrl: './stacktrace-dialog.component.html',
  styleUrls: ['./stacktrace-dialog.component.scss']
})
export class StacktraceDialogComponent {
  _stacktrace: string = null;
  stacktraceLines: StacktraceLine[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      type: string;
      message: string;
      stack?: string;
      cause?: string | ExceptionInfo;
    }
  ) {
    this._stacktrace = this.stacktraceFormatter(
        data.message,
        this.parseStackRows(data.stack),
        this.parseCause(data.cause));
  }

  stacktraceFormatter(message: string, stackRows: StackTraceRow[], stackCauses: ExceptionInfo = null): string | null {
    this.stacktraceLines = this.formatException({
      type: this.data.type,
      message,
      stackTraceRows: stackRows ?? [],
      cause: stackCauses
    });
    return this.stacktraceLines.map(line => line.text).join('\n') + '\n';
  }

  toggleFrames(line: StacktraceLine): void {
    line.expanded = !line.expanded;
  }

  private formatException(exception: ExceptionInfo, parentRows?: StackTraceRow[]): StacktraceLine[] {
    const rows = exception.stackTraceRows ?? [];
    let commonFrames = 0;
    if (parentRows) {
      while (commonFrames < rows.length && commonFrames < parentRows.length) {
        const row = rows[rows.length - 1 - commonFrames];
        const parent = parentRows[parentRows.length - 1 - commonFrames];
        if (row.className !== parent.className || row.methodName !== parent.methodName ||
            row.lineNumber !== parent.lineNumber || this.getFileName(row) !== this.getFileName(parent)) {
          break;
        }
        commonFrames++;
      }
    }

    const header = exception.type
        ? exception.type + (exception.message != null ? ': ' + exception.message : '')
        : exception.message ?? '';
    const lines: StacktraceLine[] = [
      {text: (parentRows ? 'Caused by: ' : '') + header},
      ...rows.slice(0, rows.length - commonFrames).map(row => ({text: '\tat ' + this.formatFrame(row)}))
    ];
    if (commonFrames) {
      lines.push({
        text: '\t... ' + commonFrames + ' more',
        hiddenFrames: rows.slice(rows.length - commonFrames).map(row => '\tat ' + this.formatFrame(row)),
        expanded: false
      });
    }
    if (exception.cause) {
      lines.push(...this.formatException(exception.cause, rows));
    }
    return lines;
  }

  private formatFrame(row: StackTraceRow): string {
    const fileName = this.getFileName(row);
    const location = row.lineNumber === -2 ? 'Native Method'
        : fileName == null ? 'Unknown Source'
        : fileName + (row.lineNumber >= 0 ? ':' + row.lineNumber : '');
    return row.className + '.' + row.methodName + '(' + location + ')';
  }

  private parseStackRows(value: unknown): StackTraceRow[] {
    if (value == null) return [];
    const rows: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(rows)) {
      throw new TypeError('Stacktrace must be an array of StackTraceRow');
    }
    return rows.map((row: unknown) => {
      if (!row || typeof row !== 'object') {
        throw new TypeError('Invalid StackTraceRow');
      }
      const frame = row as Record<string, unknown>;
      const lineNumber = Number(frame.lineNumber);
      if (typeof frame.className !== 'string' || typeof frame.methodName !== 'string' ||
          (typeof frame.lineNumber !== 'number' && typeof frame.lineNumber !== 'string') ||
          !Number.isInteger(lineNumber) ||
          (frame.fileName != null && typeof frame.fileName !== 'string')) {
        throw new TypeError('Invalid StackTraceRow');
      }
      const result: StackTraceRow = {className: frame.className, methodName: frame.methodName, lineNumber};
      if (frame.fileName === null || typeof frame.fileName === 'string') {
        result.fileName = typeof frame.fileName === 'string' ? frame.fileName : null;
      }
      return result;
    });
  }

  private parseCause(value: unknown): ExceptionInfo | null {
    if (value == null) return null;
    const cause: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    if (cause == null) return null;
    if (typeof cause !== 'object' || Array.isArray(cause)) {
      throw new TypeError('Cause must be an ExceptionInfo');
    }
    const exception = cause as Record<string, unknown>;
    if (typeof exception.type !== 'string' ||
        (exception.message != null && typeof exception.message !== 'string')) {
      throw new TypeError('Invalid ExceptionInfo');
    }
    return {
      type: exception.type,
      message: typeof exception.message === 'string' ? exception.message : null,
      stackTraceRows: this.parseStackRows(exception.stackTraceRows),
      cause: this.parseCause(exception.cause)
    };
  }

  getFileName(row: StackTraceRow): string | null {
    if (row.fileName !== undefined) return row.fileName;
    const start = row.className.lastIndexOf('.') + 1;
    const innerClass = row.className.indexOf('$', start);
    return row.className.substring(start, innerClass > -1 ? innerClass : row.className.length) + '.java';
  }
}
