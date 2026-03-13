import {Component, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, forkJoin, of, Subscription, switchMap} from 'rxjs';
import {app} from 'src/environments/environment';
import {Constants} from '../constants';
import {InstanceService} from 'src/app/service/jquery/instance.service';
import {LastServerStart} from 'src/app/model/jquery.model';
import {InstanceTraceService} from "../../service/jquery/instance-trace.service";
import {EnvRouter} from "../../service/router.service";
import {groupByColor} from "../../shared/util";
import {TableProvider} from '@oneteme/jquery-table';
import {DurationPipe} from "../../shared/pipe/duration.pipe";

@Component({
  templateUrl: './deploiment_v2.component.html',
  styleUrls: ['./deploiment_v2.component.scss'],
})
export class DeploimentV2Component implements OnDestroy {
  constants = Constants;
  private readonly _router = inject(EnvRouter);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _instanceService = inject(InstanceService);
  private readonly _instanceTraceService = inject(InstanceTraceService);
  private readonly _durationPipe = inject(DurationPipe);

  today: Date = new Date();
  MAPPING_TYPE = Constants.MAPPING_TYPE;
  loading: boolean = true;
  lastServers:  (LastServerStart & { lastTrace?: number })[] = [];
  versionColor: any;
  params: Partial<{ env: string }> = {};
  subscriptions: Subscription[] = [];
  onlineServerStat: number = 0;
  pendingServerStat: number = 0;
  offlineServerStat: number = 0;

  readonly tableConfig: TableProvider<LastServerStart & { lastTrace?: number }> = {
    columns: [
      { key: 'appName', header: 'Hôte', sortable: true, icon: 'dns', width: '260px', groupable: false, sliceable: false },
      { key: 'duration',   header: 'Depuis', sortable: true, icon: 'schedule', width: '150px', groupable: false, sortValue: (row) => this.today.getTime() - row.start },
      { key: 'version', header: 'Version', sortable: true, icon: 'label' },
      { key: 'branch',  header: 'Branche', sortable: true, icon: 'fork_right', width: '300px' },
      { key: 'restart', header: 'Démarrage', sortable: true, icon: 'restart_alt', width: '150px' },
    ],
    enableSearchBar: true,
    // initialSearchQuery: 'pmo',
    enableViewButton: true,
    enablePagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 25, 50],
    defaultSort: { active: 'duree', direction: 'asc' },
    slices: [
      // { title: 'Version', columnKey: 'version' },
      // { title: 'Branche', columnKey: 'branch' },
      {
        title: 'Depuis',
        columnKey: 'duration',
        categories: [
          { key: '< 1h', label: '< 1h', filter: (row) => (this.today.getTime() - row.start) / 1000 < 3600 },
          { key: '1h - 6h', label: '1h - 6h', filter: (row) => { const s = (this.today.getTime() - row.start) / 1000; return s >= 3600 && s < 6 * 3600; } },
          { key: '6h - 12h', label: '6h - 12h', filter: (row) => { const s = (this.today.getTime() - row.start) / 1000; return s >= 6 * 3600 && s < 12 * 3600; } },
          { key: '12h - 1j', label: '12h - 1j', filter: (row) => { const s = (this.today.getTime() - row.start) / 1000; return s >= 12 * 3600 && s < 86400; } },
          { key: '1j - 7j', label: '1j - 7j', filter: (row) => { const s = (this.today.getTime() - row.start) / 1000; return s >= 86400 && s < 7 * 86400; } },
          { key: '> 7 jours', label: '> 7 jours', filter: (row) => (this.today.getTime() - row.start) / 1000 >= 7 * 86400 },
        ]
      },
    ],
  };

  constructor() {
    this.subscriptions.push(combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams
    })
    .subscribe({
      next: (v: { params: Params, queryParams: Params }) => {
        this.params.env = v.queryParams.env || app.defaultEnv;
        this.getLastServerStart();
      }
    }));
  }

  getLastServerStart() {
    this.loading = true;
    this.lastServers = [];
    this.today = new Date();
    this.subscriptions.push(
      this._instanceService.getLastServerStart({env: this.params.env})
      .pipe(
        switchMap((lastServers: LastServerStart[]) => {
          return forkJoin({
            lastTraces: lastServers.length ? this._instanceTraceService.getLastInstanceTrace({instance: lastServers.map(last => last.id)}) : of([]),
            lastServers: of(lastServers)
          });
        }),
        finalize(() => (this.loading = false)))
      .subscribe({
        next: (value: {lastTraces: {id: string, date: number}[], lastServers: LastServerStart[]}) => {

          this.versionColor = groupByColor(value.lastServers, (v: any) => v.version);
          this.lastServers = value.lastServers.map(ls => ({...ls, lastTrace: value.lastTraces.find(lt => lt.id === ls.id)?.date}));;
          this.onlineServerStat = this.getOnlineServers();
          this.pendingServerStat = this.getPendingServers();
          this.offlineServerStat = this.getOfflineServers();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // Méthodes pour calculer les statistiques de serveurs
  getOnlineServers(): number {
    return this.lastServers.filter(server => {
      return !server.end && server.lastTrace && server.lastTrace >= new Date().getTime() - (server.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
    }).length;
  }

  getPendingServers(): number {
    return this.lastServers.filter(server => {
      return !server.end && server.lastTrace && server.lastTrace < new Date().getTime() - (server.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
    }).length;
  }

  getOfflineServers(): number {
    return this.lastServers.filter(server => {
      return server.end || !server.lastTrace;
    }).length;
  }

  navigateOnStatusIndicator(event: MouseEvent, row: any) {
    var date = new Date(row.lastTrace);
    this._router.navigateOnClick(event, ['/supervision', row.type.toLowerCase(), row.id], { queryParams: {env: row.env, start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString()} });
  }

  navigateOnSinceClick(event: MouseEvent, row: any) {
    this._router.navigateOnClick(event, ['/session/startup', row.id], { queryParams: {env: this.params.env} });
  }
  navigateOnServerClick(event: MouseEvent, row: any) {
    this._router.navigateOnClick(event, ['/instance/detail', row.id], { queryParams: {env: this.params.env} });
  }
  navigateOnRestartClick(event: MouseEvent, start: number, server: string) {
    this._router.navigateOnClick(event, ['/session/startup'], { queryParams: {env: this.params.env, start: new Date(start).toISOString(), end: new Date().toISOString(), server: server} });
  }
}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "duree") return (new Date().getTime() - row["start"])
  return row[columnName as keyof any] as string;
}