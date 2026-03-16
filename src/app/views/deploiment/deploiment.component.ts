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
import {TableProvider} from "@oneteme/jquery-table";
import {DEPLOIEMENT_TABLE_CONFIG} from "../../shared/_component/table/table.config";

@Component({
  templateUrl: './deploiment.component.html',
  styleUrls: ['./deploiment.component.scss'],

})
export class DeploimentComponent implements OnDestroy {
  constants = Constants;
  private readonly _router = inject(EnvRouter);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _instanceService = inject(InstanceService);
  private readonly _instanceTraceService = inject(InstanceTraceService);

  today: Date = new Date();
  MAPPING_TYPE = Constants.MAPPING_TYPE;
  rawRows: (LastServerStart & { lastTrace?: number })[] = [];
  isLoading = false;
  readonly tableConfig: TableProvider<LastServerStart & { lastTrace?: number }> = DEPLOIEMENT_TABLE_CONFIG;

  versionColor: any;
  params: Partial<{ env: string }> = {};
  subscriptions: Subscription[] = [];
  onlineServerStat: number = 0;
  pendingServerStat: number = 0;
  offlineServerStat: number = 0;

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
    this.isLoading = true;
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
        finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (value: {lastTraces: {id: string, date: number}[], lastServers: LastServerStart[]}) => {
          this.versionColor = groupByColor(value.lastServers, (v: any) => v.version);
          this.rawRows = value.lastServers.map(ls => ({...ls, lastTrace: value.lastTraces.find(lt => lt.id === ls.id)?.date}));
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
    return this.rawRows.filter(server => {
      return !server.end && server.lastTrace && server.lastTrace >= new Date().getTime() - (server.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
    }).length;
  }

  getPendingServers(): number {
    return this.rawRows.filter(server => {
      return !server.end && server.lastTrace && server.lastTrace < new Date().getTime() - (server.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
    }).length;
  }

  getOfflineServers(): number {
    return this.rawRows.filter(server => {
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
