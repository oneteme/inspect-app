import {Component, EventEmitter, inject, Input, Output} from "@angular/core";
import {InspectCollectorConfiguration} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";

export function resolveInstanceStatus(value: {end: number, configuration: InspectCollectorConfiguration, lastTrace: number, date: number}, datePipe: DatePipe): {class: 'online' | 'pending' | 'offline', tooltip: string} {
  let interval = value.date - (value.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
  if(value.end || !value.lastTrace) {
    return {class: 'offline', tooltip: value.end ? `Instance arrêtée le ${datePipe.transform(new Date(value.end), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}` : 'Aucune trace remontée'};
  }
  const tooltip = `Dernière trace remontée le ${datePipe.transform(new Date(value.lastTrace), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}`;
  return {class: value.lastTrace < interval ? 'pending' : 'online', tooltip};
}

@Component({
  selector: 'app-status-indicator',
  template: `
    <div class="status-indicator" *ngIf="!loading"
         (click)="navigate($event)"
         [matTooltip]="tooltip"
         [ngClass]="class">
      
      <div class="status-dot"></div>
    </div>
    <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
  `,
  styles: [`
      .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;

          .status-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
          }

          &.online {
              background: rgba(16, 185, 129, 0.1);

              .status-dot {
                  background: #10b981;
                  animation: pulse-success 2s infinite;
              }

              &:hover {
                  background: rgba(16, 185, 129, 0.2);
              }
          }

          &.pending {
              background: rgba(245, 158, 11, 0.1);

              .status-dot {
                  background: #f59e0b;
              }

              &:hover {
                  background: rgba(245, 158, 11, 0.2);
              }
          }

          &.offline {
              background: rgba(100, 116, 139, 0.1);

              .status-dot {
                  background: #94a3b8;
              }

              &:hover {
                  background: rgba(100, 116, 139, 0.2);
              }
          }
      }

      @keyframes pulse-success {
          0%, 100% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
              box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
          }
      }
  `]
})
export class StatusIndicatorComponent {
  private readonly _datePipe = inject(DatePipe);

  class: string;
  tooltip: string;

  @Input() loading: boolean = false;

  @Input() set params(value: {id: string, end: number, configuration: InspectCollectorConfiguration, lastTrace: number, date: number}) {
    if(value) {
      this.getStatus(value);
    }
  };
  @Output() onClick: EventEmitter<MouseEvent> = new EventEmitter();

  navigate(event: MouseEvent) {
    this.onClick.emit(event);
  }

  getStatus(value: {id: string, end: number, configuration: InspectCollectorConfiguration, lastTrace: number, date: number}) {
    const status = resolveInstanceStatus(value, this._datePipe);
    this.class = status.class;
    this.tooltip = status.tooltip;
  }
}
