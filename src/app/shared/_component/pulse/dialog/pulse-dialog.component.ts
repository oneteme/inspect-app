import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  templateUrl: './pulse-dialog.component.html',
  styleUrls: ['./pulse-dialog.component.scss']
})
export class PulseDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: {instance: string, instanceStart: Date, start: Date, end: Date}) { }

}