import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TraceService } from 'src/app/service/trace.service';
import { combineLatest } from 'rxjs';
import { Location } from '@angular/common';
import { application } from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent  {

    displayedColumns: string[] = ['message'];
    dataSource: MatTableDataSource<{ count: number, message: string, class: string }> = new MatTableDataSource([]);
    paramsSubscription: any;
    env: any;
    constructor(private _activatedRoute: ActivatedRoute,
        private _traceService: TraceService,
        private _router: EnvRouter,
        private _location: Location) {
        
        this.paramsSubscription = combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || application.default_env;
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

}
