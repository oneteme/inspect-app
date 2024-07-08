import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { OutcomingQuery } from "src/app/shared/model/trace.model";
import { DatabaseRequest } from "src/app/shared/model/v3/trace.model";
import { Utils } from "src/app/shared/util";

@Component({
    selector: 'request-database-table',
    templateUrl: './request-database-table.component.html',
    styleUrls: ['./request-database-table.component.scss']
})
export class RequestDatabaseTableComponent implements OnInit {
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
        let command = ""
        if (commands?.length == 1) {
            command = `[${commands[0]}]`
        } else if (commands?.length > 1) {
            command = "[SQL]"
        }
        return command;
    }

    selectedQuery(event: MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }

    statusBorder(status: any) {
        return Utils.statusBorder(status);
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "duree") return (row["end"] - row["start"])
    var columnValue = row[columnName as keyof any] as string;
    return columnValue;
}