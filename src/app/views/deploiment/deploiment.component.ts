import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {combineLatest, finalize, Subscription} from 'rxjs';
import { app} from 'src/environments/environment';
import { Constants } from '../constants';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InstanceService } from 'src/app/service/jquery/instance.service';
import { LastServerStart } from 'src/app/model/jquery.model';
import { MatTableDataSource } from '@angular/material/table';

@Component({
    templateUrl: './deploiment.component.html',
    styleUrls: ['./deploiment.component.scss'],

})
export class DeploimentComponent implements OnDestroy  {
    constants = Constants;
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _instanceService= inject(InstanceService);

    today: Date = new Date();
    MAPPING_TYPE = Constants.MAPPING_TYPE;
    serverStartDisplayedColumns: string[] = ["appName", "version", "duree","branch","collector"];
    lastServerStart: {data?:MatTableDataSource<LastServerStart[]>, isLoading?:boolean} = {};
    versionColor: any;
    collectorColor: any;
    branchColor:any;
    params: Partial<{ env: string }> = {};
    subscriptions: Subscription[] = [];

    @ViewChild('lastServerStartTablePaginator')lastServerStartTablePaginator: MatPaginator;
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

    getLastServerStart(){
        this.lastServerStart.isLoading =true;

        this.subscriptions.push(this._instanceService.getlastServerStart({ env: this.params.env})
        .pipe(finalize(()=>(this.lastServerStart.isLoading =false)))
        .subscribe({
            next: ((d:any)=> {
                this.versionColor  = this.groupBy(d,(v:any)=> v.version)
                this.collectorColor = this.groupBy(d,(v:any)=> v.collector)
                this.branchColor = this.groupBy(d,(v:any)=> v.branch)
                this.lastServerStart.data = new MatTableDataSource(d);
                this.lastServerStart.data.paginator = this.lastServerStartTablePaginator;
                this.lastServerStart.data.sort = this.lastServerStartTableSort;
                this.lastServerStart.data.sortingDataAccessor = sortingDataAccessor;
            })
        }));
    }    

    groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } { // todo : refacto
        return array.reduce((acc: any, item: any) => {
            let id = fn(item);
            if(id){
                if (!acc[id]) {
                    acc[id] = this.getRandomColor();
                }
            }
            return acc;
        }, {})
    }

    getRandomColor(): string{
        const letters = '0123456789ABCDEF';
        let color ='#';
        for(let i = 0; i < 6; i++){
            color+= letters[Math.floor(Math.random()* 16)];
        }
        return color;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "duree") return (new Date().getTime() - row["start"])
    return row[columnName as keyof any] as string;
}