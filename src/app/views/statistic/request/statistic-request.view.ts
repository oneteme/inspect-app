import {Component, inject, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Constants} from "../../constants";
import {combineLatest} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {EnvRouter} from "../../../service/router.service";
import {IPeriod, QueryParams} from "../../../model/conf.model";
import {app, makeDatePeriod} from "../../../../environments/environment";
import {StatisticComponentResolverService} from "./statistic-component-resolver.service";

@Component({
  templateUrl: './statistic-request.view.html',
  styleUrls: ['./statistic-request.view.scss']
})
export class StatisticRequestView implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(EnvRouter);
  private readonly _componentResolver = inject(StatisticComponentResolverService);
  private readonly _viewContainerRef = inject(ViewContainerRef);

  filterForm = new FormGroup({
    type: new FormControl<'jdbc' | 'ftp' | 'smtp' | 'ldap' | 'rest' | null>(null, [Validators.required]),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  REQUEST_MAPPING_TYPE = Constants.REQUEST_MAPPING_TYPE;

  params: Partial<{type: 'jdbc' | 'ftp' | 'smtp' | 'ldap' | 'rest', queryParams: QueryParams}> = {};

  ngOnInit() {
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams
    }).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {
        this.params.type = v.params.request_type;
        this.params.queryParams = new QueryParams(new IPeriod(v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(0, 1).start, v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(0, 1).end), v.queryParams.env || app.defaultEnv)
        this.patchTypeValue();
        this.patchDateValue(this.params.queryParams.period.start, new Date(this.params.queryParams.period.end.getFullYear(), this.params.queryParams.period.end.getMonth(), this.params.queryParams.period.end.getDate() - 1));
        if(this.params.type) {
          const componentType = this._componentResolver.resolveComponent(this.params.type);
          this.loadComponent(componentType);
        }
      }
    });
  }

  ngOnDestroy() {

  }

  onTypeChange(type: 'jdbc' | 'ftp' | 'smtp' | 'ldap' | 'rest') {
    if(this.filterForm.valid) {
      this._router.navigate(['dashboard/request', type], {
        queryParams: this.params.queryParams.buildParams()
      });
    }
  }

  onChangeEnd(event) {
    if(this.filterForm.valid) {
      let start = this.filterForm.controls.dateRange.controls.start.value;
      let end = this.filterForm.controls.dateRange.controls.end.value;
      this.params.queryParams.period = new IPeriod(start, new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1));
      this._router.navigate([], {
        relativeTo: this._activatedRoute,
        queryParams: this.params.queryParams.buildParams()
      });
    }
  }

  patchTypeValue() {
    this.filterForm.patchValue({
      type: this.params.type
    }, {emitEvent: false, onlySelf: true});
  }

  patchDateValue(start: Date, end: Date) {
    this.filterForm.controls.dateRange.patchValue({
      start: start,
      end: end
    }, {emitEvent: false, onlySelf: true});
  }

  private loadComponent(componentType: any): void {
    this._viewContainerRef.clear();
    let componentRef = this._viewContainerRef.createComponent(componentType);
    componentRef.setInput('queryParams', this.params.queryParams);
  }
}