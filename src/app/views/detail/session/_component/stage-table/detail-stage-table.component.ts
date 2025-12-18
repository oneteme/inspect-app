import {Component, Input, ViewChild} from "@angular/core";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {HttpSessionStage} from "../../../../../model/trace.model";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'stage-table',
  templateUrl: './detail-stage-table.component.html',
  styleUrls: ['./detail-stage-table.component.scss']
})
export class DetailStageTableComponent {
  displayedColumns: string[] = ['name',  'start', 'duree'];
  dataSource: MatTableDataSource<HttpSessionStage> = new MatTableDataSource();

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() set requests(requests: HttpSessionStage[]) {
    if(requests) {
      this.dataSource = new MatTableDataSource(requests);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }else{
      this.dataSource = new MatTableDataSource();
    }
  }
}