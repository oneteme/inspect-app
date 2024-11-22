import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
    selector: 'server-history-table',
    styleUrls: ['server-history-table.component.scss'],
    templateUrl: './server-history-table.component.html'
})
export class ServerHistoryTableComponent {
    displayedColumns: string[] = ['version', 'duration'];
    dataSource: MatTableDataSource<{ version: string, start: number }> = new MatTableDataSource([]);
    today: Date = new Date();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                return { version: r.version, start: r.start };
            }));
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}