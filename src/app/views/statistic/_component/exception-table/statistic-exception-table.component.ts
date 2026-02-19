import { Component, Input, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { pipe } from "rxjs";
import {MatSort} from "@angular/material/sort";

@Component({
    selector: 'exception-table',
    templateUrl: './statistic-exception-table.component.html',
    styleUrls: ['./statistic-exception-table.component.scss'],
})
export class StatisticExceptionTableComponent {
    displayedColumns: string[] = ['label', 'count'];
    dataSource: MatTableDataSource<{ count: number, label: string }> = new MatTableDataSource([]);

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    @Input() set data(objects: any) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}