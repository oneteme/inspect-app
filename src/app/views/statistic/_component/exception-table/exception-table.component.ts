import { Component, Input, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { pipe } from "rxjs";

@Component({
    selector: 'exception-table',
    templateUrl: './exception-table.component.html',
    styleUrls: ['./exception-table.component.scss'],
})
export class ExceptionTableComponent {
    displayedColumns: string[] = ['message'];
    dataSource: MatTableDataSource<{ count: number, message: string, class: string }> = new MatTableDataSource([]);
    addExceptionCount: number = 0;

    @Input() set data(objects: any) {
        if (objects?.length) {  //.pipe(map((d: any) => d.slice(0, 5)))
            this.dataSource = new MatTableDataSource(objects.slice(0, 5).map((r: {COUNT: number, errorMessage: string, errorType: string}) => {
                const index = r?.errorType.lastIndexOf('.') + 1;
                return { count: r.COUNT, message: r?.errorMessage, class: r?.errorType?.substring(index) };
            }));
            if (objects.length > 5) {
                this.addExceptionCount = objects.reduce((acc: number, curr: any, i: number) => {
                    if (i >= 5 ) {
                        acc += curr['COUNT'];
                    }
                    return acc;
                }  , 0);
            }
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}