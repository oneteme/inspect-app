import { Component, Input, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";

export interface TableColumn {
    field: string;
    header: string;
    width?: string;
    type?: 'text' | 'badge' | 'number';
}

@Component({
    selector: 'exception-table',
    templateUrl: './statistic-exception-table.component.html',
    styleUrls: ['./statistic-exception-table.component.scss'],
})
export class StatisticExceptionTableComponent {
    displayedColumns: string[] = ['label', 'count'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource([]);

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    @Input() set columns(cols: TableColumn[]) {
        if (cols?.length) {
            this._columns = cols;
            this.displayedColumns = cols.map(c => c.field);
        }
    }
    _columns: TableColumn[] = [
        { field: 'label', header: 'Label', type: 'text' },
        { field: 'count', header: 'Count', width: '10%', type: 'badge' }
    ];

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
    @Input() title: string = 'Exception';
    @Input() icon: string = 'warning';
}