import {Component, EventEmitter, inject, Input, Output, TemplateRef} from "@angular/core";
import {InstanceEnvironment} from "../../../model/trace.model";
import {InstanceTraceService} from "../../../service/jquery/instance-trace.service";
import {finalize} from "rxjs";
import {MatMenu} from "@angular/material/menu";
import {EnvRouter} from "../../../service/router.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-server-card',
  templateUrl: './server-card.component.html',
  styleUrls: ['./server-card.component.scss']
})
export class ServerCardComponent {
  private readonly _instanceTraceService = inject(InstanceTraceService);
  protected readonly _router: EnvRouter = inject(EnvRouter);

  _instance: InstanceEnvironment;
  _lastTrace: number;
  _isLoadingLastTrace: boolean = false;

  @Input() set instance(value: InstanceEnvironment) {
    if(value) {
      this._instance = value;
      this._isLoadingLastTrace = true;
      this._instanceTraceService.getLastInstanceTrace({instance: [value.id]})
      .pipe(finalize(() => this._isLoadingLastTrace = false))
      .subscribe({
        next: trace => {
          this._lastTrace = trace[0]?.date;
        }
      })
    }
  };

  @Input() menu: MatMenu;
  @Output() onClick: EventEmitter<MouseEvent> = new EventEmitter();

  navigate(event: MouseEvent) {
    this.onClick.emit(event);
  }

  navigateOnServerClick(event: MouseEvent) {
    this._router.navigateOnClick(event, ['/instance/detail', this._instance.id], { queryParams: {env: this._instance.env} });
  }
}