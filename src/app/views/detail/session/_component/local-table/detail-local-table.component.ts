import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {LocalRequest, NamingRequest} from "../../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
    selector: 'local-table',
    templateUrl: './detail-local-table.component.html',
    styleUrls: ['./detail-local-table.component.scss']
})
export class DetailLocalTableComponent implements OnInit {
    displayedColumns: string[] = ['status', 'name', 'location',  'start', 'duration'];
    dataSource: MatTableDataSource<LocalRequest> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: LocalRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
        }
    }

    ngOnInit() {
        this.dataSource.sortingDataAccessor = sortingDataAccessor;
    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "location") return row["location"] as string;
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return (row["end"] - row["start"]);
    return row[columnName as keyof any] as string;
}