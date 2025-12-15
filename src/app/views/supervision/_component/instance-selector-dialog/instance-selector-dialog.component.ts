import { Component, inject, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface InstanceSelectorDialogData {
  instances: {id: string, appName: string, start: number, end: number}[];
  selectedServer: string | null;
  selectedInstance: {id: string, appName: string, start: number, end: number} | null;
  isLoadingInstances: boolean;
}

@Component({
  selector: 'instance-selector-dialog',
  templateUrl: './instance-selector-dialog.component.html',
  styleUrls: ['./instance-selector-dialog.component.scss']
})
export class InstanceSelectorDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InstanceSelectorDialogComponent>);

  selectedServer: string | null;
  selectedInstance: {id: string, appName: string, start: number, end: number} | null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: InstanceSelectorDialogData) {
    this.selectedServer = data.selectedServer;
    this.selectedInstance = data.selectedInstance;
  }

  get filteredInstances() {
    return this.data.instances.filter(s => s.appName == this.selectedServer);
  }

  onServerChange() {
    this.selectedInstance = null;
  }

  confirm() {
    if (this.selectedInstance) {
      this.dialogRef.close({
        server: this.selectedServer,
        instance: this.selectedInstance
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}

