import {Component, inject, OnInit} from '@angular/core';
import {catchError, combineLatest, finalize, forkJoin, map, of, Subject, switchMap, takeUntil} from "rxjs";
import {app} from "../../../../environments/environment";
import {ActivatedRoute} from "@angular/router";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
import {
  AbstractStage,
  DatabaseRequestStage, FtpRequestStage,
  HttpRequestStage,
  InspectCollectorConfiguration,
  InstanceEnvironment, MachineResource
} from "../../../model/trace.model";
import {RequestType} from "../../../model/request.model";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {InstanceService} from "../../../service/jquery/instance.service";
import {INFINITY} from "../../constants";
import {getDataForRange, getErrorClassName, showifnotnull} from "../../../shared/util";
import {ConfigDialogComponent} from "../../supervision/_component/config-dialog/config-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {TabData} from "../session/_component/detail-session.component";
import {EnvRouter} from "../../../service/router.service";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-instance',
  templateUrl: './instance.component.html',
  styleUrls: ['./instance.component.scss']
})
export class InstanceComponent implements OnInit {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private _instanceService = inject(InstanceService);
  private readonly _dialog = inject(MatDialog);
  private readonly _router: EnvRouter = inject(EnvRouter);

  params: Partial<{id: string, env: string}> = {};
  private readonly $destroy = new Subject<void>();
  private readonly pipe = new DatePipe('fr-FR');
  private readonly durationPipe = new DurationPipe();
  options: TimelineOptions;
  dataItems: DataItem[];
  tabs: TabData[] = [];
  dataGroups: DataGroup[];
  dataSource: MatTableDataSource<InstanceEnvironment> = new MatTableDataSource();
  instance: InstanceEnvironment;
  configuration: string;
  resource: string;
  isLoading: boolean;
  allInstance : any[];
  timelineStart: number
  timelineEnd: number
  selectedTabIndex: number = 0;
  displayedColumns: string[] = ['resource', 'additional-properties'];

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
        this.initTabs();
      }
    });
  }
  getRequest() {
    this.instance = null;
    this.isLoading = true;

    this._instanceService.getInstanceInfo({
      env: this.params.env,
      id: this.params.id
    }).pipe(takeUntil(this.$destroy),
        switchMap(instance => {
          this.instance = instance;
          this.dataSource = new MatTableDataSource([instance]);
          return this._instanceService.getInstancesPeriodsByAppName({
            env: this.params.env,
            appName: this.instance.name,
            address: this.instance.type === 'CLIENT' ? this.instance.address : undefined
          }).pipe(
              map(instances => ({
                instances
              }))
        );
        }),
        finalize(() => this.isLoading = false)
        ).subscribe({
        next : result => {
          this.allInstance = result.instances;
          if (this.instance?.configuration) {
            this.configuration = JSON.stringify(this.instance.configuration, null, 4);
          }

          if (this.instance?.resource) {
            this.resource = JSON.stringify(this.instance.resource, null, 4);
          }

          this.createTimeline();
        }

    })
  }

  openConfig(config: InspectCollectorConfiguration |MachineResource) {
    this._dialog.open(ConfigDialogComponent, {
      data: config
    });
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
        label: 'Properties',
        icon: 'settings',
        count: 0,
        visible: true,
        type: 'properties',
        hasError: false,
        errorCount: 0
      }
    ]
  }
  getDate(start: number) {
    return new Date(start);
  }
  navigateOnStatusIndicator(event: MouseEvent) {
    var date = new Date(this.instance.instant * 1000);
    this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString(), env: this.params.env} });
  }
  createTimeline() {
    console.log(this.allInstance)
    this.timelineStart = Math.trunc(this.allInstance[0].start );
    this.timelineEnd =  Math.trunc(this.allInstance.at(-1).start);
  console.log(this.timelineStart);
    console.log(this.timelineEnd);

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
    console.log(this.instance.id === this.allInstance.at(-1).id);
    let items = this.allInstance.map((a: any, i: number) => {
      let start= Math.trunc(a.start);
      let end = a.end? Math.trunc(a.end) : INFINITY;
      return {
        group: `${groupByContent.get(a.version)}`,
        start: start,
        end: end,
        type: end <= start ? 'point' : 'range',
        content:  this.instance.type === 'CLIENT' ? a.re:a.branch + ' / ' + a.hash,
        className: `${this.instance.id === a.id ? 'instance-active' : 'instance'}`,
        title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>`
      };
    });
    console.log(items);



    let padding = (Math.ceil((this.timelineEnd - this.timelineStart)*0.1));
    console.log(items);
    console.log(groups);
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

}
