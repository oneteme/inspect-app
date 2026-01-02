import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {LocalRequest} from "../../../../../model/trace.model";

@Component({
    selector: 'local-table',
    templateUrl: './detail-local-table.component.html',
    styleUrls: ['./detail-local-table.component.scss']
})
export class DetailLocalTableComponent{
    displayedColumns: string[] = ['type', 'location', 'name',  'start', 'duree', 'user'];
    dataSource: MatTableDataSource<LocalRequest> = new MatTableDataSource();

    @ViewChild('paginator', {static: true}) paginator: MatPaginator;
    @ViewChild('sort', {static: true}) sort: MatSort;

    @Input() set requests(requests: LocalRequest[]) {
        if(requests) {
            this.dataSource = new MatTableDataSource(requests);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = sortingDataAccessor;
        }else{
            this.dataSource = new MatTableDataSource();
        }

    }
}

const sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "location") return row["location"] as string;
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return (row["end"] - row["start"]);
    return row[columnName as keyof any] as string;
}