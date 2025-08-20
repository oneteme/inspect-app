import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {ANALYTIC_MAPPING} from "../../../../constants";
import {UserAction} from "../../../../../model/trace.model";

@Component({
    selector: 'action-table',
    templateUrl: './action-table.component.html',
    styleUrls: ['./action-table.component.scss']
})
export class ActionTableComponent {
    protected readonly ANALYTIC_MAPPING = ANALYTIC_MAPPING;
    displayedColumns: string[] = ['type', 'node', 'name', 'date'];
    dataSource: MatTableDataSource<UserAction> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: UserAction[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            //this.dataSource.sortingDataAccessor = sortingDataAccessor;
        }
    }
}