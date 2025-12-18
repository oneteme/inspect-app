import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-stacktrace-dialog',
  template: `
    <h1 mat-dialog-title>
      <mat-icon>error_outline</mat-icon>
      Stacktrace
    </h1>
    <div mat-dialog-content>
      <pre><code>{{ data.stacktrace }}</code></pre>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="close()">Fermer</button>
    </div>
  `,
  styles: [`
    h1 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
    }
    [mat-dialog-content] {
      background-color: #f7f7f7;
      border-radius: 8px;
      margin-top: 8px;
    }
    pre {
      margin: 0;
      padding: 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #333;
    }
    [mat-dialog-actions] {
      padding-top: 24px;
    }
  `]
})
export class StacktraceDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StacktraceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { stacktrace: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}

