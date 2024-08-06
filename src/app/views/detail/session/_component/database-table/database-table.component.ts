import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { DatabaseRequest } from "src/app/model/trace.model";
import { Utils } from "src/app/shared/util";

@Component({
    selector: 'database-table',
    templateUrl: './database-table.component.html',
    styleUrls: ['./database-table.component.scss']
})
export class DatabaseTableComponent implements OnInit {
    displayedColumns: string[] = ['status', 'host', 'schema', 'start', 'duree'];
    dataSource: MatTableDataSource<DatabaseRequest> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: DatabaseRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        }
    }
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    ngOnInit() {
        this.dataSource.sortingDataAccessor = sortingDataAccessor;
    }

    getElapsedTime(end: number, start: number,) {
        return end - start;
    }

    getCommand(commands: string[]): string {
        let command = "[--]";
        if (commands?.length == 1) {
            command = `[${commands[0]}]`
        } else if (commands?.length > 1) {
            command = "[SQL]"
        }
        return command;
    }

    selectedQuery(event: MouseEvent, row: number) {
        console.log(row)
        this.onClickRow.emit({event: event, row: row});
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return (row["end"] - row["start"])
    return row[columnName as keyof any] as string;
}