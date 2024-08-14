import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {RestRequest} from "src/app/model/trace.model";

@Component({
    selector: 'rest-table',
    templateUrl: './detail-rest-table.component.html',
    styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent implements OnInit {
    displayedColumns: string[] = ['status', 'host', 'path', 'start', 'duree'];
    dataSource: MatTableDataSource<RestRequest> = new MatTableDataSource();
    filterTable = new Map<string, any>();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: RestRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        }
    }
    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    ngOnInit() {
        this.dataSource.sortingDataAccessor = sortingDataAccessor;
        this.dataSource.filterPredicate = filterPredicate;
    }
    
    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.filterTable.set('filter', filterValue.trim().toLowerCase());
        this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    toggleFilter(filter: string[]) {
        this.filterTable.set('status', filter);
        this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
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

const filterPredicate = (data: RestRequest, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let isMatch = true;
    for (let [key, value] of map.entries()) {
        if (key == 'filter') {
            isMatch = isMatch && (value == '' ||
                (data.host?.toLowerCase().includes(value) || data.method?.toLowerCase().includes(value) || data.query?.toLowerCase().includes(value) ||
                data.path?.toLowerCase().includes(value)));
        } else if (key == 'status') {
            const s = data.status.toString();
            isMatch = isMatch && (!value.length || (value.some((status: any) => {
                return s.startsWith(status[0]);
            })));
        }
    }
    return isMatch;
}
