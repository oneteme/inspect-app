import {Component, inject, Input} from "@angular/core";
import {InspectCollectorConfiguration, InstanceEnvironment} from "../../../model/trace.model";
import {ConfigDialogComponent} from "../config-dialog/config-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-version-badge',
  template: `
    <div class="version-chip"
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
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #c8d8e8;
      background: #f0f4f8;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      max-width: 200px;

      &.clickable {
        cursor: pointer;
        &:hover {
          border-color: #bfdbfe;
          background: #eff6ff;
        }
      }

      .chip-value {
        font-weight: 700;
        color: #22577a;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chip-action {
        font-size: 12px;
        width: 12px;
        height: 12px;
        color: #94a3b8;
        flex-shrink: 0;
      }
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