import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {combineLatest, finalize, map, Subject, switchMap, takeUntil} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";
import {InstanceEnvironment} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {InstanceService} from "../../../service/jquery/instance.service";
import {groupByColor} from "../../../shared/util";
import {TabData} from "../session/_component/detail-session.component";
import {EnvRouter} from "../../../service/router.service";
import {MatTableDataSource} from "@angular/material/table";
import {TraceService} from "../../../service/trace.service";

@Component({
  selector: 'app-instance',
  templateUrl: './instance.component.html',
  styleUrls: ['./instance.component.scss']
})
export class InstanceComponent implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _instanceService = inject(InstanceService);
  private readonly _traceService = inject(TraceService);
  private readonly _router = inject(EnvRouter);

  params: Partial<{id: string, env: string}> = {};
  private readonly $destroy = new Subject<void>();
  private readonly pipe = new DatePipe('fr-FR');
  private readonly durationPipe = new DurationPipe();
  options: TimelineOptions;
  dataItems: DataItem[];
  tabs: TabData[] = [];
  dataGroups: DataGroup[];
  instance: InstanceEnvironment;
  configuration: string;
  resource: string;
  isLoading: boolean;
  allInstance : any[];
  timelineStart: number
  timelineEnd: number
  selectedTabIndex: number = 0;
  resourceData: { key: string; value: any }[] = [];
  propertiesData: { key: string; value: any }[] = [];
  versionColor: any;

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.params.id = params.id_instance;
        this.params.env = queryParams.env;
        this.getRequest();
      }
    });
  }

  getRequest() {
    this.instance = null;
    this.isLoading = true;

    this._traceService.getInstance(this.params.id)
    .pipe(
      takeUntil(this.$destroy),
      switchMap(instance => {
        this.instance = instance;
        this.versionColor = groupByColor([instance], (v: any) => v.version)
        this.resourceData = this.toKeyValueArray( this.instance.resource);
        this.propertiesData = this.toKeyValueArray( this.instance.properties);
        return this._instanceService.getInstancesPeriodsByAppName({
          env: this.params.env,
          appName: this.instance.name,
          address: this.instance.type === 'CLIENT' ? this.instance.address : undefined
        })
        .pipe(
            map(instances => ({
              instances
            }))
        );
      }),
      finalize(() => this.isLoading = false))
    .subscribe({
        next : result => {
          this.allInstance = result.instances;
          if (this.instance?.configuration) {
            this.configuration = JSON.stringify(this.instance.configuration, null, 4);
          }
          if (this.instance?.resource) {
            this.resource = JSON.stringify(this.instance.resource, null, 4);
          }
          this.createTimeline();
          this.initTabs();
        }
    })
  }

  initTabs() {
    this.tabs = [
      {
        label: 'Instances',
        icon: 'view_object_track',
        count: 0,
        visible: true,
        type: 'instances',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Chronologie',
        icon: 'view_timeline',
        count: 0,
        visible: true,
        type: 'timeline',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Paramètres ',
        icon: 'tune',
        count: 0,
        visible: !!this.instance.resource,
        type: 'resource',
        hasError: false,
        errorCount: 0,
      },
      {
        label: 'Propriétés',
        icon: 'list_alt',
        count: 0,
        visible: !!this.instance.properties,
        type: 'property',
        hasError: false,
        errorCount: 0,
      }
    ]
  }
  getDate(start: number) {
    return new Date(start);
  }
  navigateOnStatusIndicator(event: MouseEvent) {
    var date = new Date(this.instance.instant);
    this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString(), env: this.params.env} });
  }
  createTimeline() {
    this.timelineStart = Math.trunc(this.allInstance[0].start );
    this.timelineEnd =  Math.trunc(this.allInstance.at(-1).start);

    const groups = [...new Set(this.allInstance.map(a =>  a?.version))]
        .filter(v => v != null)
        .map((version, i) => ({
          id: i,
          content: version,
          treeLevel: 2
        }));
    const groupByContent = new Map<string, number>(
        groups.map(g => [g.content, g.id])
    );
    let items = this.allInstance.map((a: any, i: number) => {
      let start= Math.trunc(a.start);
      let end = a.end? Math.trunc(a.end) :  new Date().getTime();
      return {
        group: `${groupByContent.get(a.version)}`,
        start: start,
        end: end,
        type: end <= start ? 'point' : 'range',
        content:  this.instance.type === 'CLIENT' ? a.re:a.branch? a.branch + ' / ' + a.hash : 'N/A',
        className: `${this.instance.id === a.id ? 'instance-active' : 'instance'}` + `${a.end ? '' : ' in-progress'}`,
        title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>`
      };
    });

    let padding = (Math.ceil((this.timelineEnd - this.timelineStart)*0.1));
    this.dataItems = items;
    this.dataGroups = groups;
     this.options = {
      start: this.timelineStart - padding,
      end: this.timelineEnd + padding,
      selectable : false,
      clickToUse: true,
      tooltip: {
        followMouse: true
      }
    };
  }
  toKeyValueArray(obj: any): { key: string; value: any }[] {
    if (!obj) {
      return [];
    }

    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : value
    }));
  }

}
