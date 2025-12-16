import {Component, EventEmitter, inject, Input, OnDestroy, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {EnvRouter} from "../../../../../service/router.service";
import {Subject} from "rxjs";
import {DatePipe} from "@angular/common";
import {RestRequestDto} from "../../../../../model/request.model";
import {INFINITY} from "../../../../constants";

@Component({
    selector: 'rest-table',
    templateUrl: './detail-rest-table.component.html',
    styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent implements OnDestroy {
    private readonly _router = inject(EnvRouter);
    private readonly pipe = new DatePipe('fr-FR');
    private readonly $destroy = new Subject<void>();

    displayedColumns: string[] = ['host', 'path', 'start', 'duree','action'];
    dataSource: MatTableDataSource<RestRequestDto> = new MatTableDataSource();
    filterTable :string;

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() useFilter: boolean;
    @Input() isLoading: boolean;
    @Input() pageSize: number;
    @Input() set requests(requests: RestRequestDto[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
            this.dataSource.filterPredicate = this.useFilter && this.filterPredicate;
            this.dataSource.filter = JSON.stringify(this.filterTable);
            this.dataSource.paginator.pageIndex = 0;
        }else{
            this.dataSource = new MatTableDataSource();
        }
    }
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();
    @Output() onClickRemote: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    selectedRemote(event: MouseEvent, row: any) {
        this.onClickRemote.emit({event: event, row: row});
    }

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

    filterPredicate = (data: RestRequestDto, filter: string) => {
        let date = new Date(data.start*1000)
        filter = JSON.parse(filter)
        let isMatch = true;
        return  isMatch && (filter == '' ||
            (data.host?.toLowerCase().includes(filter) ||
                data.path?.toLowerCase().includes(filter) ||
                data.status?.toString().toLowerCase().includes(filter) ||
                this.pipe.transform(date,"dd/MM/yyyy").toLowerCase().includes(filter) ||
                this.pipe.transform(date,"HH:mm:ss.SSS").toLowerCase().includes(filter) ||
                data.exception?.message?.toString().toLowerCase().includes(filter) ||
                data.exception?.type?.toString().toLowerCase().includes(filter)
            ));
    };

    sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "host") return row["host"] + ":" + row["port"] as string;
        if (columnName == "start") return row['start'] as string;
        if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;

        return row[columnName as keyof any] as string;
    }

    navigate(event: MouseEvent, element: any) {

        let segment = 'rest';
            if(element.type) segment = `main/${element.type}`;
            if (event.ctrlKey) {
                this._router.open(`#/session/${segment}/${element.parent}`, '_blank',)
            } else {
                this._router.navigate([`/session/${segment}`, element.parent,], {
                    queryParams: { env: element.env }
                });
            }
    }
}
