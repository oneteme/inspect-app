import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { AdminService } from '../../service/admin.service';

@Component({
  templateUrl: './add-environment-dialog.component.html',
  styleUrls: ['./add-environment-dialog.component.scss']
})
export class AddEnvironmentDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<AddEnvironmentDialogComponent>);
  private readonly _adminService = inject(AdminService);

  readonly namespace = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]
  });

  readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^.{6,}$/)]
  });

  isSubmitting = false;

  add(): void {
    const namespace = this.namespace.value.trim();
    this.isSubmitting = true;
    this._adminService.addNamespace(namespace, this.password.value)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: added => {
          if (added) {
            this._dialogRef.close(namespace);
          }
        }
      });
  }
}
