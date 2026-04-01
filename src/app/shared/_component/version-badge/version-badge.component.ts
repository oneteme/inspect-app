import {Component, inject, Input} from "@angular/core";
import {InspectCollectorConfiguration, InstanceEnvironment} from "../../../model/trace.model";
import {ConfigDialogComponent} from "../config-dialog/config-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-version-badge',
  template: `
    <div class="info-chip version-chip"
         *ngIf="version"
         [class.clickable]="configuration"
         (click)="configuration ? openConfig(configuration, $event) : null"
         [matTooltip]="collector || ''">
      <mat-icon class="material-symbols-outlined chip-action" [style.color]="backgroundColor || null" *ngIf="configuration">settings</mat-icon>
      <span class="chip-value" [style.color]="backgroundColor || null">{{ version }}</span>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .version-chip {
      border-color: #c8d8e8;
      background: #f0f4f8;
    }
  `]
})
export class VersionBadgeComponent {
  private readonly _dialog = inject(MatDialog);

  @Input() backgroundColor: string;
  @Input() version: string;
  @Input() collector: string;
  @Input() name: string;
  @Input() configuration: InspectCollectorConfiguration;
  @Input() instance: InstanceEnvironment;

  openConfig(config: InspectCollectorConfiguration, event: any) {
    event.stopPropagation();
    this._dialog.open(ConfigDialogComponent, {
      data: { name: this.name, version: this.version, collector: this.collector, config: config }
    });
  }
}