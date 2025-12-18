import {Component, inject, Input} from "@angular/core";
import {InspectCollectorConfiguration} from "../../../model/trace.model";
import {ConfigDialogComponent} from "../../../views/supervision/_component/config-dialog/config-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-version-badge',
  template: `
    <div class="version-badge"
         *ngIf="version"
         [ngStyle]="{'cursor': configuration ? 'pointer' : 'default'}"
         (click)="configuration ? openConfig(configuration) : null"
         [style.background-color]="backgroundColor"
         [matTooltip]="collector">
      <mat-icon class="material-symbols-outlined" *ngIf="configuration">settings</mat-icon>
      {{ version }}
    </div>
  `,
  styles: [`
      .version-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          color: white;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
          }

          &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
      }
  `]
})
export class VersionBadgeComponent {
  private readonly _dialog = inject(MatDialog);

  @Input() backgroundColor: string;
  @Input() version: string;
  @Input() collector: string;
  @Input() configuration: InspectCollectorConfiguration;

  openConfig(config: InspectCollectorConfiguration) {
    this._dialog.open(ConfigDialogComponent, {
      data: config
    });
  }
}