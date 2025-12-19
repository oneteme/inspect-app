import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {DatePipe} from "@angular/common";
import {FtpRequestDto} from "../../../../../model/request.model";
import {INFINITY} from "../../../../constants";

@Component({
    selector: 'ftp-table',
    templateUrl: './detail-ftp-table.component.html',
    styleUrls: ['./detail-ftp-table.component.scss']
})
export class DetailFtpTableComponent {
    private readonly pipe = new DatePipe('fr-FR');
    displayedColumns: string[] = ['host', 'command', 'start', 'duree'];
    dataSource: MatTableDataSource<FtpRequestDto> = new MatTableDataSource();

    filterTable =new Map<string, any>();
    @Input() filterValue: string = '';
    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: FtpRequestDto[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
            this.dataSource.filterPredicate = this.useFilter && this.filterPredicate;
            if (this.filterValue) {
                this.filterTable.set('filter', this.filterValue.trim().toLowerCase());
            }
            console.log(JSON.stringify(Array.from(this.filterTable.entries())))
            this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
            this.dataSource.paginator.pageIndex = 0;
        }else{
            this.dataSource = new MatTableDataSource();
        }
    }
    @Input() useFilter: boolean;
    @Input() isLoading: boolean;
    @Input() pageSize: number;
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    selectedRequest(event: MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.filterTable.set('filter', filterValue.trim().toLowerCase());
        this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    filterPredicate = (data: FtpRequestDto, filter: string) => {
        var map: Map<string, any> = new Map(JSON.parse(filter));
        let date = new Date(data.start*1000)
        let isMatch = true;
        for (let [key, value] of map.entries()) {
            if (key == 'filter') {
                isMatch = isMatch && (value == '' ||
                    (data.host?.toLowerCase().includes(value) ||
                    this.pipe.transform(date, "dd/MM/yyyy").toLowerCase().includes(value) ||
                    this.pipe.transform(date, "HH:mm:ss.SSS").toLowerCase().includes(value) ||
                    data.exception?.message?.toString().toLowerCase().includes(value) ||
                    data.exception?.type?.toString().toLowerCase().includes(value) ||
                    data.command?.toLowerCase().includes(value)
                    ));
            }
        }
        return isMatch
    }

    sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "host") return row["host"] + ":" + row["port"] as string;
        if (columnName == "start") return row['start'] as string;
        if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;

        return row[columnName as keyof any] as string;
    }
}