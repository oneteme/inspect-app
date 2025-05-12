import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {DatabaseRequest, RestRequest} from "src/app/model/trace.model";

@Component({
    selector: 'database-table',
    templateUrl: './detail-database-table.component.html',
    styleUrls: ['./detail-database-table.component.scss']
})
export class DetailDatabaseTableComponent {
    displayedColumns: string[] = ['status', 'host', 'schema', 'start', 'duree'];
    dataSource: MatTableDataSource<DatabaseRequest> = new MatTableDataSource();
    filterTable :string;

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: DatabaseRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = sortingDataAccessor;
            this.dataSource.filterPredicate = this.useFilter && filterPredicate;
            this.dataSource.filter = JSON.stringify(this.filterTable)
        }
    }
    @Input() useFilter: boolean;
    @Input() isLoading: boolean;
    @Input() pageSize: number;
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    getCommand(commands: string): string {
        let command = "--";
        if (commands) {
            command = commands;
        }
        return `[${command}]`;
    }

    selectedQuery(event: MouseEvent, row: number) {
        this.onClickRow.emit({event: event, row: row});
    }

    applyFilter(event: Event) {
        this.filterTable = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = JSON.stringify(this.filterTable);
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return (row["end"] - row["start"])
    return row[columnName as keyof any] as string;
}

const filterPredicate = (data: DatabaseRequest, filter: string) => {
    filter = JSON.parse(filter)
    let isMatch = true;
    return  isMatch && (filter == '' ||
        (data.host?.toLowerCase().includes(filter) ||
            data.name?.toLowerCase().includes(filter) ||
            data.schema?.toLowerCase().includes(filter) ||
            data.command?.toLowerCase().includes(filter) ||
            data.status?.toString().toLowerCase().includes(filter)
            //add  start and end filter
        ));
};