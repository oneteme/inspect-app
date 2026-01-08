import {Component, Input} from "@angular/core";
import {ExceptionInfo} from "../../../model/trace.model";
import {MatDialog} from '@angular/material/dialog';
import {StacktraceDialogComponent} from './stacktrace-dialog/stacktrace-dialog.component';

@Component({
  selector: 'exception-display',
  templateUrl: './exception-display.component.html',
  styleUrls: ['./exception-display.component.scss']
})
export class ExceptionDisplayComponent {
  _exception: ExceptionInfo = null;

  constructor(private dialog: MatDialog) {}

  @Input() type: 'fail' | 'warning' | 'success' = 'fail';
  @Input() set exception(value: ExceptionInfo) {
    if(value) {
      this._exception = value;
    }
  }

  showStacktrace() {
    this.dialog.open(StacktraceDialogComponent, {
      width: '80vw',
      data: { message: this._exception.message, stackTraceRows: this._exception.stackTraceRows }
    });
  }
}