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
    couleur = ["#22577a","#38a3a5","#57cc99","#80ed99","#c7f9cc"]
    serverStartDisplayedColumns: string[] = ["appName", "version", "duree","branch"];
    lastServerStart: {data?:MatTableDataSource<LastServerStart[]>, isLoading?:boolean} = {};
    versionColor: any;
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
        this.today = new Date();
        this.subscriptions.push(this._instanceService.getlastServerStart({ env: this.params.env})
        .pipe(finalize(()=>(this.lastServerStart.isLoading =false)))
        .subscribe({
            next: ((d:any)=> {
                this.versionColor  = this.groupBy(d,(v:any)=> v.version)
                this.lastServerStart.data = new MatTableDataSource(d);
                this.lastServerStart.data.paginator = this.lastServerStartTablePaginator;
                this.lastServerStart.data.sort = this.lastServerStartTableSort;
                this.lastServerStart.data.sortingDataAccessor = sortingDataAccessor;
            })
        }));
    }    

    groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } { // todo : refacto
        let i = 0;
        return array.reduce((acc: any, item: any) => {
            let id = fn(item);
            if(id){
                if (!acc[id]) {
                    if(i==4){
                        i=0;
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

    protected readonly Date = Date;
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "duree") return (new Date().getTime() - row["start"])
    return row[columnName as keyof any] as string;
}