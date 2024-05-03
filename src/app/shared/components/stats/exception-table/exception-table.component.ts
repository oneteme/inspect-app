import { Component, Input, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";

@Component({
    selector: 'exception-table',
    templateUrl: './exception-table.component.html',
    styleUrls: ['./exception-table.component.scss'],
})
export class ExceptionTableComponent {
    displayedColumns: string[] = ['message'];
    dataSource: MatTableDataSource<{count:number, message: string }> = new MatTableDataSource([]);

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                return {count: r['COUNT'], message: r.errorMessage };
            }));
            this.dataSource.paginator = this.paginator;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}