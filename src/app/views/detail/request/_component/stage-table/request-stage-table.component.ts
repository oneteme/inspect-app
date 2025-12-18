import {Component, Input, ViewChild} from "@angular/core";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {AbstractStage, HttpSessionStage} from "../../../../../model/trace.model";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {INFINITY} from "../../../../constants";

@Component({
  selector: 'request-stage-table',
  templateUrl: './request-stage-table.component.html',
  styleUrls: ['./request-stage-table.component.scss']
})
export class RequestStageTableComponent {
  displayedColumns: string[] = ['name', 'args', 'start', 'duree'];
  dataSource: MatTableDataSource<AbstractStage> = new MatTableDataSource();

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() set requests(requests: AbstractStage[]) {
    if(requests) {
      this.dataSource = new MatTableDataSource(requests);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }

  sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;
    return row[columnName as keyof any] as string;
  }
}