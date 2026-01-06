import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {LocalRequest, LogEntry} from "../../../../../model/trace.model";

@Component({
  selector: 'log-table',
  templateUrl: './detail-log-table.component.html',
  styleUrls: ['./detail-log-table.component.scss']
})
export class DetailLogTableComponent {
  displayedColumns: string[] = ['level', 'date', 'message', 'action'];
  dataSource: MatTableDataSource<LogEntry> = new MatTableDataSource();

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() set requests(requests: LogEntry[]) {
    if (requests) {
      this.dataSource = new MatTableDataSource(requests);
      this.dataSource.paginator = this.paginator;

      this.dataSource.sortingDataAccessor = sortingDataAccessor;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource();
    }

  }
}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "message") return row["message"] as string;
  if (columnName == "instant") return row['instant'] as string;
  return row[columnName as keyof any] as string;
}