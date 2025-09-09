import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {InspectCollectorConfiguration, MachineResource, StackTraceRow} from "../../../../model/trace.model";
import {json} from "node:stream/consumers";

@Component({
  selector: 'stacktrace-dialog',
  styleUrls: ['./config-dialog.component.scss'],
  templateUrl: 'config-dialog.component.html',
})
export class ConfigDialogComponent {
  value: string = "";
  constructor(@Inject(MAT_DIALOG_DATA) public data: InspectCollectorConfiguration) {
    this.value = JSON.stringify(data, null, 4);
  }
}