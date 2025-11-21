import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, forkJoin, of, Subscription, switchMap} from 'rxjs';
import {app} from 'src/environments/environment';
import {Constants} from '../constants';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {InstanceService} from 'src/app/service/jquery/instance.service';
import {LastServerStart} from 'src/app/model/jquery.model';
import {MatTableDataSource} from '@angular/material/table';
import {MatDialog} from "@angular/material/dialog";
import {StacktraceDialogComponent} from "../supervision/_component/stacktrace-dialog/stacktrace-dialog.component";
import {ConfigDialogComponent} from "../supervision/_component/config-dialog/config-dialog.component";
import {InspectCollectorConfiguration} from "../../model/trace.model";
import {InstanceTraceService} from "../../service/jquery/instance-trace.service";
import {EnvRouter} from "../../service/router.service";
import {DatePipe} from "@angular/common";

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
  private readonly _dialog = inject(MatDialog);
  private readonly _datePipe = inject(DatePipe);

  today: Date = new Date();
  MAPPING_TYPE = Constants.MAPPING_TYPE;
  couleur = ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"]
  serverStartDisplayedColumns: string[] = ["appName", "duree", "version", "branch", "restart"];
  lastServerStart: { data?: MatTableDataSource<LastServerStart>, isLoading?: boolean } = {};
  versionColor: any;
  params: Partial<{ env: string }> = {};
  subscriptions: Subscription[] = [];
  activityStatus: {[key: string]: {css: string, lastTrace: number, tooltip: string}} = {};

  @ViewChild('lastServerStartTablePaginator') lastServerStartTablePaginator: MatPaginator;
  @ViewChild('lastServerStartTableSort') lastServerStartTableSort: MatSort;

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
    this.lastServerStart.isLoading = true;
    this.today = new Date();
    this.subscriptions.push(
      this._instanceService.getLastServerStart({env: this.params.env})
      .pipe(
        switchMap((lastServerStarts: LastServerStart[]) => {
          return forkJoin({
            lastTrace: this._instanceTraceService.getLastInstanceTrace({instance: lastServerStarts.map(last => last.id)}),
            lastServer: of(lastServerStarts)
          });
        }),
        finalize(() => (this.lastServerStart.isLoading = false)))
      .subscribe({
        next: (value: {lastTrace: {id: string, date: number}[], lastServer: LastServerStart[]}) => {
          this.activityStatus = value.lastServer.reduce((acc: {[key: string]: {css: string, lastTrace: number, tooltip: string}}, curr) => {
            let lastTrace = value.lastTrace.find(lt => lt.id === curr.id);
            let interval = (curr.configuration?.scheduling.interval + 60 || 60 * 60) * 1000;
            if(curr.end || !lastTrace ) {
              acc[curr.id] = {css: 'offline', lastTrace: curr.end || curr.start, tooltip: curr.end ? `Serveur arrêté le ${this._datePipe.transform(this.toDate(curr.end), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}` : 'Aucune trace remontée'};
            } else if(lastTrace.date < new Date().getTime() - interval){
              acc[curr.id] = {css: 'pending', lastTrace: lastTrace.date, tooltip: `Dernière trace remontée le ${this._datePipe.transform(this.toDate(lastTrace.date), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}`};
            } else {
              acc[curr.id] = {css: 'online', lastTrace: lastTrace.date, tooltip: `Dernière trace remontée le ${this._datePipe.transform(this.toDate(lastTrace.date), 'dd/MM/yyyy à HH:mm:ss.SSS', 'fr')}`};
            }
            return acc;
          }, {});
          this.versionColor = this.groupBy(value.lastServer, (v: any) => v.version)
          this.lastServerStart.data = new MatTableDataSource(value.lastServer);
          this.lastServerStart.data.paginator = this.lastServerStartTablePaginator;
          this.lastServerStart.data.sort = this.lastServerStartTableSort;
          this.lastServerStart.data.sortingDataAccessor = sortingDataAccessor;
        }
      })
    );
  }

  groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } { // todo : refacto
    let i = 0;
    return array.reduce((acc: any, item: any) => {
      let id = fn(item);
      if (id) {
        if (!acc[id]) {
          if (i == 4) {
            i = 0;
          }
          acc[id] = this.couleur[i];
          i++;
        }
      }
      return acc;
    }, {})
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  openConfig(config: InspectCollectorConfiguration) {
    this._dialog.open(ConfigDialogComponent, {
      data: config
    });
  }

  toDate(value: number) {
    return new Date(value);
  }
}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "duree") return (new Date().getTime() - row["start"])
  return row[columnName as keyof any] as string;
}