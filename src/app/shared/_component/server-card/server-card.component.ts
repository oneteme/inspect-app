import {Component, inject, Input} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {InstanceEnvironment} from "../../../model/trace.model";
import {InstanceTraceService} from "../../../service/jquery/instance-trace.service";
import {finalize} from "rxjs";
import {MatMenu} from "@angular/material/menu";
import {EnvRouter} from "../../../service/router.service";
import {DatePipe} from "@angular/common";
import {resolveInstanceStatus} from "../status-indicator/status-indicator.component";

@Component({
  selector: 'app-server-card',
  templateUrl: './server-card.component.html',
  styleUrls: ['./server-card.component.scss']
})
export class ServerCardComponent {
  private readonly _instanceTraceService = inject(InstanceTraceService);
  private readonly _datePipe = inject(DatePipe);
  protected readonly _router: EnvRouter = inject(EnvRouter);
  private readonly _activatedRoute = inject(ActivatedRoute);

  date = new Date();
  _instance: InstanceEnvironment;
  _lastTrace: number;
  _isLoadingLastTrace: boolean = false;
  _status: {class: string, tooltip: string} | null = null;

  @Input() set instance(value: InstanceEnvironment) {
    if(value) {
      this._instance = value;
      this._isLoadingLastTrace = true;
      this._status = null;
      this._instanceTraceService.getLastInstanceTrace({instance: [value.id]})
      .pipe(finalize(() => {
        this._isLoadingLastTrace = false;
        this._status = resolveInstanceStatus({end: value.end, configuration: value.configuration, lastTrace: this._lastTrace, date: this.date.getTime()}, this._datePipe);
      }))
      .subscribe({
        next: trace => {
          this._lastTrace = trace[0]?.date;
        }
      })
    }
  };

  @Input() menu: MatMenu;
  @Input() supervisionQueryParams: Params | null = null;


  navigate(event: MouseEvent) {
    this._router.navigateOnClick(event, ['/supervision', this._instance.type.toLowerCase(), this._instance.id], {
      queryParams: this.buildSupervisionQueryParams()
    });
  }

  navigateOnServerClick(event: MouseEvent) {
    this._router.navigateOnClick(event, ['/instance/detail', this._instance.id], { queryParams: {namespace: this._instance.namespace} });
  }

  private buildSupervisionQueryParams(): Params {
    if (this.supervisionQueryParams) {
      return {
        namespace: this._instance.namespace,
        ...this.supervisionQueryParams
      };
    }

    const currentQueryParams = this._activatedRoute.snapshot.queryParams;
    const queryParams: Params = { namespace: this._instance.namespace };

    if (currentQueryParams.step && currentQueryParams.from) {
      queryParams.step = currentQueryParams.step;
      queryParams.from = currentQueryParams.from;
      return queryParams;
    }

    if (currentQueryParams.step) {
      queryParams.step = currentQueryParams.step;
      return queryParams;
    }

    if (currentQueryParams.start && currentQueryParams.end) {
      queryParams.start = currentQueryParams.start;
      queryParams.end = currentQueryParams.end;
      if (currentQueryParams.app_name) {
        queryParams.app_name = currentQueryParams.app_name;
      }
      return queryParams;
    }

    return queryParams;
  }
}
