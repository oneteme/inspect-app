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
/*.slice(0, 5).map((r: {count: number, errorType: string}) => {
    const index = r?.errorType.lastIndexOf('.') + 1;
    return { count: r.count, class: r?.errorType?.substring(index) };
})*/
    @Input() set data(objects: any) {
        console.log(objects)
        if (objects?.length) {  //.pipe(map((d: any) => d.slice(0, 5)))
            this.dataSource = new MatTableDataSource(objects);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}