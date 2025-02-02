import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {FtpRequest} from "src/app/model/trace.model";

@Component({
    selector: 'ftp-table',
    templateUrl: './detail-ftp-table.component.html',
    styleUrls: ['./detail-ftp-table.component.scss']
})
export class DetailFtpTableComponent implements OnInit {
    displayedColumns: string[] = ['status', 'host', 'start', 'duree'];
    dataSource: MatTableDataSource<FtpRequest> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: FtpRequest[]) {
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
