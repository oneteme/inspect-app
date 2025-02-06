import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {MailRequest} from "src/app/model/trace.model";

@Component({
    selector: 'smtp-table',
    templateUrl: './detail-smtp-table.component.html',
    styleUrls: ['./detail-smtp-table.component.scss']
})
export class DetailSmtpTableComponent  {
    displayedColumns: string[] = ['status', 'host', 'start', 'duree'];
    dataSource: MatTableDataSource<MailRequest> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: MailRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = sortingDataAccessor;
        }
    }
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    selectedRequest(event: MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "host") return row["host"] + ":" + row["port"] as string;
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return (row["end"] - row["start"]);
    return row[columnName as keyof any] as string;
}
