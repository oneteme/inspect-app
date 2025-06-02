import {Component, EventEmitter, inject, Input, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {RestRequest} from "src/app/model/trace.model";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {EnvRouter} from "../../../../../service/router.service";
import {RestRequestService} from "../../../../../service/jquery/rest-request.service";
import {finalize, Subscription} from "rxjs";
import {DatePipe} from "@angular/common";
import {Utils} from "../../../../../shared/util";

@Component({
    selector: 'rest-table',
    templateUrl: './detail-rest-table.component.html',
    styleUrls: ['./detail-rest-table.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: '0'})),
            state('expanded', style({height: '*'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class DetailRestTableComponent {
    private readonly _router = inject(EnvRouter);
    private readonly pipe = new DatePipe('fr-FR');
    private readonly _restRequestService = inject(RestRequestService);
    displayedColumns: string[] = ['status', 'host', 'path', 'start', 'duree', 'remote'];
    dataSource: MatTableDataSource<RestRequest> = new MatTableDataSource();
    expandedElement: RestRequest | null;
    requestDetail: RestRequest;
    isRequestDetailLoading: boolean = false;
    restRequestDetailSubscription: Subscription;
    filterTable :string;

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() useFilter: boolean;
    @Input() isLoading: boolean;
    @Input() pageSize: number;
    @Input() set requests(requests: RestRequest[]) {
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

    

    selectedRequest(event: MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }

    getRequestDetail(row:any){
        if(this.restRequestDetailSubscription){
            this.restRequestDetailSubscription.unsubscribe();
        }
        this.expandedElement = this.expandedElement  === row ? null : row
        if(this.expandedElement){
            this.requestDetail= null;
            this.isRequestDetailLoading= true;
            this.restRequestDetailSubscription = this._restRequestService.getRequestById(row.idRequest)
                .pipe(finalize(() => this.isRequestDetailLoading = false))
                .subscribe(data => {
                    this.requestDetail = data;
                })
        }
    }

    applyFilter(event: Event) {
        this.filterTable = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.dataSource.filter = JSON.stringify(this.filterTable);
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    filterPredicate = (data: RestRequest, filter: string) => {
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
        if (columnName == "duree") return (row["end"] - row["start"]);
        return row[columnName as keyof any] as string;
    }

    getSessionUrl() {
        return Utils.getSessionUrl(this.requestDetail);
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
