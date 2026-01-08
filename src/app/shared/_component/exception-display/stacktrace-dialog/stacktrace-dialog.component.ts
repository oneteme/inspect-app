import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {StackTraceRow} from "../../../../model/trace.model";

@Component({
  selector: 'app-stacktrace-dialog',
  template: `
    <h1 mat-dialog-title>
      <mat-icon>error_outline</mat-icon>
      Stacktrace
    </h1>
    <div mat-dialog-content>
      <pre><code>{{ _stacktrace }}</code></pre>
    </div>
  `,
  styles: [`
    h1 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mdc-dialog__title {
      padding: 9px 24px 9px;
      color: #f44336;
    }
    pre {
      background-color: #f7f7f7;
      margin: 0;
      padding: 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #333;
    }
  `]
})
export class StacktraceDialogComponent {
  _stacktrace: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string, stackTraceRows: StackTraceRow[] }
  ) {
    this._stacktrace = this.stacktraceFormatter(data.message, data.stackTraceRows);
  }

  stacktraceFormatter(message: string, stackTraceRows: StackTraceRow[]) {
    return stackTraceRows && message ? `${message} \n  at ${stackTraceRows.map(d => `${d.className}.${d.methodName}(${this.getFileName(d)}:${d.lineNumber})`).join('\n  at ')}` : null;
  }

  getFileName(row: StackTraceRow): string {
    let bg = row.className.lastIndexOf('.') + 1;
    let to = row.className.indexOf('$');
    return row.className.substring(bg, to > -1 ? to : row.className.length) + ".java";
  }
}

