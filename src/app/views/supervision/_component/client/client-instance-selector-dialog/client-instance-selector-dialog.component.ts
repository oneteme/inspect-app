import { Component, inject, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface InstanceSelectorDialogData {
  instances: {id: string, appName: string, address:string,  start: number, end: number}[];
  selectedServer: string | null;
  selectedAddress: string | null;
  selectedInstance: {id: string, appName: string, address:string, start: number, end: number} | null;
  isLoadingInstances: boolean;
}

@Component({
  selector: 'instance-selector-dialog',
  templateUrl: './client-instance-selector-dialog.component.html',
  styleUrls: ['./client-instance-selector-dialog.component.scss']
})
export class ClientInstanceSelectorDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ClientInstanceSelectorDialogComponent>);

  addressList: string[]= []
  selectedServer: string | null;
  selectedInstance: {id: string, appName: string, address:string, start: number, end: number} | null;
  selectedAddress: string | null;
  constructor(@Inject(MAT_DIALOG_DATA) public data: InstanceSelectorDialogData) {
    this.selectedServer = data.selectedServer;
    this.selectedAddress = data.selectedAddress;
    this.selectedInstance = data.selectedInstance;
    this.addressList = [...new Set(this.data.instances.map(i => i.address))]
  }

  get filteredInstances() {
    return this.data.instances.filter(s => s.appName == this.selectedServer && s.address == this.selectedAddress);
  }

  onServerChange() {
    this.selectedInstance = null;
  }

  confirm() {
    if (this.selectedInstance) {
      this.dialogRef.close({
        server: this.selectedServer,
        instance: this.selectedInstance,
        address: this.selectedAddress
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  onAddressChange(){
    if(this.filteredInstances.length> 0 ){
      this.selectedInstance = this.filteredInstances.reduce((a, b) => (a.start > b.start ? a : b), this.filteredInstances[0])
    }
  }
}

