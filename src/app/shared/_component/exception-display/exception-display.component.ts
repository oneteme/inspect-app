import {Component, Input} from "@angular/core";
import {ExceptionInfo, StackTraceRow} from "../../../model/trace.model";
import {MatDialog} from '@angular/material/dialog';
import {StacktraceDialogComponent} from './stacktrace-dialog/stacktrace-dialog.component';

@Component({
  selector: 'exception-display',
  templateUrl: './exception-display.component.html',
  styleUrls: ['./exception-display.component.scss']
})
export class ExceptionDisplayComponent {
  _exception: ExceptionInfo = null;
  clipboardText = '';
  copied = false;
  private _copyTimer: any;

  constructor(private dialog: MatDialog) {}

  @Input() type: 'fail' | 'warning' | 'success' = 'fail';

  @Input() set exception(value: ExceptionInfo) {
    if (value) {
      this._exception = value;
      this.clipboardText = this.buildClipboard(value);
    }
  }

  onCopied() {
    this.copied = true;
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => (this.copied = false), 2000);
  }

  showStacktrace() {
    this.dialog.open(StacktraceDialogComponent, {
      width: '80vw',
      height: '60vh',
      data: { type: this._exception.type, message: this._exception.message, stackTraceRows: this._exception.stackTraceRows }
    });
  }

  private buildClipboard(exc: ExceptionInfo): string {
    let text = exc.type ? `${exc.type}: ` : '';
    text += exc.message ?? '';
    return text;
  }
}