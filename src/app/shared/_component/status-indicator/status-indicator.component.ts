import {Component, inject, Input} from "@angular/core";
import {EnvRouter} from "../../../service/router.service";
import {InspectCollectorConfiguration} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-status-indicator',
  template: `
    <div class="status-indicator"
         (click)="navigate($event)"
         [matTooltip]="tooltip"
         [ngClass]="class">
      <div class="status-dot"></div>
    </div>
  `,
  styles: [`
      .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
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
                  animation: pulse-warning 2s infinite;
              }

              &:hover {
                  background: rgba(245, 158, 11, 0.2);
              }
          }

          &.offline {
              background: rgba(239, 68, 68, 0.1);

              .status-dot {
                  background: #ef4444;
                  animation: pulse-error 2s infinite;
              }

              &:hover {
                  background: rgba(239, 68, 68, 0.2);
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

      @keyframes pulse-warning {
          0%, 100% {
              box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
          }
          50% {
              box-shadow: 0 0 0 4px rgba(245, 158, 11, 0);
          }
      }

      @keyframes pulse-error {
          0%, 100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
              box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
          }
      }
  `]
})
export class StatusIndicatorComponent {
  private readonly _router = inject(EnvRouter);
  private readonly _datePipe = inject(DatePipe);

  class: string;
  tooltip: string;
  instance: {id: string, type: string, end: number, env: string, configuration: InspectCollectorConfiguration, lastTrace: number};

  @Input() set params(value: {id: string, type: string, end: number, env: string, configuration: InspectCollectorConfiguration, lastTrace: number}) {
    if(value) {
      this.instance = value;
      this.getStatus(value);
    }
  };

  navigate(event: MouseEvent) {
    this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {env: this.instance.env, start: new Date(this.instance.lastTrace - 1000 * 60 * 60 * 12).toISOString(), end: new Date(this.instance.lastTrace + 1000 * 60 * 60 * 12).toISOString()} });
  }

  getStatus(value: {id: string, type: string, end: number, env: string, configuration: InspectCollectorConfiguration, lastTrace: number}) {
    let interval = (value.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
    if(value.end || !value.lastTrace) {
      this.class = 'offline';
      this.tooltip = value.end ? `Serveur arrêté le ${this._datePipe.transform(new Date(value.end), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}` : 'Aucune trace remontée';
    } else if(value.lastTrace < new Date().getTime() - interval){
      this.class = 'pending';
      this.tooltip = `Dernière trace remontée le ${this._datePipe.transform(new Date(value.lastTrace), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}`;
    } else {
      this.class = 'online';
      this.tooltip = `Dernière trace remontée le ${this._datePipe.transform(new Date(value.lastTrace), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}`
    }
  }
}