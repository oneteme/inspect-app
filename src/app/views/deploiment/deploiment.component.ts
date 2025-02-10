import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest, finalize} from 'rxjs';

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
export class DeploimentComponent   {
    constants = Constants;
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _instanceService= inject(InstanceService);

    today: Date = new Date();
    MAPPING_TYPE = Constants.MAPPING_TYPE;
    serverStartDisplayedColumns: string[] = ["appName", "version", "duree","branch","collector"];
    isLoading: boolean= false;
    lastServerStart: {data?:MatTableDataSource<LastServerStart[]>, isLoading?:boolean} = {};
    versionColor: any;
    collectorColor: any;
    // serverStartTable: { observable: }) }
    params: Partial<{ env: string, start: Date, end: Date, serveurs: string[] }> = {};


    @ViewChild('lastServerStartTablePaginator')lastServerStartTablePaginator: MatPaginator;
    @ViewChild('lastServerStartTableSort') lastServerStartTableSort: MatSort;

    constructor() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        })
  
        .subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || app.defaultEnv;
                this.getLastServerStart();
            }
        });


    }

    getLastServerStart(){
        this.lastServerStart.isLoading =true;
        this._instanceService.getlastServerStart({ env: this.params.env})
        .pipe(finalize(()=>(this.lastServerStart.isLoading =false)))
        .subscribe({
            next: ((d:any)=> {
                this.versionColor  = this.groupBy(d,(v:any)=> v.version)
                this.collectorColor = this.groupBy(d,(v:any)=> v.collector)
                console.log(this.collectorColor)
                this.lastServerStart.data = new MatTableDataSource(d);
                this.lastServerStart.data.paginator = this.lastServerStartTablePaginator;
                this.lastServerStart.data.sort = this.lastServerStartTableSort;
                this.lastServerStart.data.sortingDataAccessor = sortingDataAccessor;
            })
        });
    }    

    groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } { // todo : refacto
        return array.reduce((acc: any, item: any) => {
            var id = fn(item);
            if(!id)
                id= "N/A"
            if(!acc){
                acc={}
            }
            if (!acc[id]) {
                acc[id] = this.getRandomColor();
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
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "duree") return (new Date().getTime() - row["start"])
    return row[columnName as keyof any] as string;
}