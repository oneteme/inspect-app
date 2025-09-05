import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {StackTraceRow} from "../../../../model/trace.model";

@Component({
  selector: 'stacktrace-dialog',
  styleUrls: ['./stacktrace-dialog.component.scss'],
  templateUrl: 'stacktrace-dialog.component.html',
})
export class StacktraceDialogComponent {
  value: string = "";
  constructor(@Inject(MAT_DIALOG_DATA) public data: { date: string, level: string, message: string, stacktrace: StackTraceRow[] }) {
    this.value = `${data.message} \n  at ${data.stacktrace.map(d => `${d.className}.${d.methodName}(${this.getFileName(d)}:${d.lineNumber})`).join('\n  at ')}`;
  }

  getFileName(row: StackTraceRow): string {
    let bg = row.className.lastIndexOf('.') + 1;
    let to = row.className.indexOf('$');
    return row.className.substring(bg, to > -1 ? to : row.className.length) + ".java";
  }
}