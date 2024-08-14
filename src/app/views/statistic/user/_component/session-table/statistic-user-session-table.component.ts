import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";

@Component({
    selector: 'session-table',
    styleUrls: ['./statistic-user-session-table.component.scss'],
    templateUrl: './statistic-user-session-table.component.html',
})
export class StatisticUserSessionTableComponent {
    displayedColumns: string[] = ['appName', 'name', 'location', 'start'];
    dataSource: MatTableDataSource<{ name: string, start: number, elapsedtime: number, location: string, appName: string }> = new MatTableDataSource([]);
    
    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                return { name: r.name, start: r.date, elapsedtime: r.elapsedtime, location: r.location, appName: r.appName };
            }));
            this.dataSource.paginator = this.paginator;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;
}