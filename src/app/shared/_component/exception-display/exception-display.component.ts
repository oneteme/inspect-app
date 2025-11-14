import {Component, Input} from "@angular/core";
import {ExceptionInfo, StackTraceRow} from "../../../model/trace.model";

@Component({
  selector: 'exception-display',
  templateUrl: './exception-display.component.html',
  styleUrls: ['./exception-display.component.scss']
})
export class ExceptionDisplayComponent {
  _exception: ExceptionInfo = null;
  _stacktrace: string = null;
  _showStacktrace: boolean = false;

  @Input() set exception(value: ExceptionInfo) {
    if(value) {
      this._exception = value;
      this._stacktrace = this.stacktraceFormatter(value);
    }
  }

  stacktraceFormatter(exception: ExceptionInfo) {
    return exception?.stackTraceRows && exception?.message ? `${exception.message} \n  at ${exception.stackTraceRows.map(d => `${d.className}.${d.methodName}(${this.getFileName(d)}:${d.lineNumber})`).join('\n  at ')}` : null;
  }

  getFileName(row: StackTraceRow): string {
    let bg = row.className.lastIndexOf('.') + 1;
    let to = row.className.indexOf('$');
    return row.className.substring(bg, to > -1 ? to : row.className.length) + ".java";
  }
}
