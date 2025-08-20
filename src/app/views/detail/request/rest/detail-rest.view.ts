import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {catchError, combineLatest, finalize, forkJoin, of, Subject, takeUntil} from "rxjs";
import {app} from "../../../../../environments/environment";
import {RequestType, RestRequestDto} from "../../../../model/request.model";
import {Utils} from "../../../../shared/util";
import {Constants} from "../../../constants";
import {ExceptionInfo} from "../../../../model/trace.model";

@Component({
  templateUrl: './detail-rest.view.html',
  styleUrls: ['./detail-rest.view.scss'],
})
export class DetailRestView implements OnInit, OnDestroy {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _traceService: TraceService = inject(TraceService);
  private readonly _router: EnvRouter = inject(EnvRouter);
  private readonly $destroy = new Subject<void>();

  private params: Partial<{idRest: string, env: string}> = {};
  REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
  request: RestRequestDto;
  exception: ExceptionInfo;

  isLoading: boolean;

  sessionParent: { id: string, type: string };
  parentLoading: boolean = false;

  ngOnInit() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.params = {idRest: params.id_request, env: queryParams.env || app.defaultEnv};
        this.getRequest();
      }
    });
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  getRequest() {
    this.request = null;
    this.isLoading = true;
    this.parentLoading = true;
    this.sessionParent = null;
    this._traceService.getSessionParent(RequestType.REST, this.params.idRest).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
    forkJoin({
      request: this._traceService.getRestRequest(this.params.idRest)
    }).pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false)).subscribe({
      next: (value: {request: RestRequestDto}) => {
        this.request = value.request;
        this.exception = value.request.exception;
      }
    });
  }

  getSessionUrl() {
    return Utils.getSessionUrl(this.request);
  }

  navigate(event: MouseEvent, targetType: string, extraParam?: string) {
    let params: any[] = [];
    switch (targetType) {
      case "parent":
        params.push('session', this.sessionParent.type.toLowerCase(), this.sessionParent.id);
    }
    if (event.ctrlKey) {
      this._router.open(`#/${params.join('/')}`, '_blank')
    } else {
      this._router.navigate(params, {
        queryParams: {env: this.params.env}
      });
    }
  }
}