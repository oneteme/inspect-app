import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {DatePipe} from "@angular/common";
import {MailRequestDto} from "../../../../../model/request.model";

@Component({
    selector: 'smtp-table',
    templateUrl: './detail-smtp-table.component.html',
    styleUrls: ['./detail-smtp-table.component.scss']
})
export class DetailSmtpTableComponent  {
    private readonly pipe = new DatePipe('fr-FR');
    displayedColumns: string[] = ['status', 'host', 'start', 'duree'];
    dataSource: MatTableDataSource<MailRequestDto> = new MatTableDataSource();
    filterTable :string;

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: MailRequestDto[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
            this.dataSource.filterPredicate = this.useFilter && this.filterPredicate;
            this.dataSource.filter = JSON.stringify(this.filterTable)
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
        this.filterTable = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = JSON.stringify(this.filterTable);
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "host") return row["host"] + ":" + row["port"] as string;
        if (columnName == "start") return row['start'] as string;
        if (columnName == "duree") return (row["end"] - row["start"]);
        return row[columnName as keyof any] as string;
    }

    filterPredicate = (data: MailRequestDto, filter: string) => {
        let date = new Date(data.start*1000)
        filter = JSON.parse(filter)
        let isMatch = true;
        return  isMatch && (filter == '' ||
            (data.host?.toLowerCase().includes(filter) ||
            this.pipe.transform(date,"dd/MM/yyyy").toLowerCase().includes(filter) ||
            this.pipe.transform(date,"HH:mm:ss.SSS").toLowerCase().includes(filter) ||
            data.exception?.message?.toString().toLowerCase().includes(filter) ||
            data.exception?.type?.toString().toLowerCase().includes(filter)
            ));
    };

}