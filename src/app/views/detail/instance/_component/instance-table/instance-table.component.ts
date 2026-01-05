import {Component, inject, Input, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {AbstractStage} from "../../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {INFINITY} from "../../../../constants";
import {EnvRouter} from "../../../../../service/router.service";
import {groupByColor} from "../../../../../shared/util";

@Component({
  selector: 'instance-table',
  templateUrl: './instance-table.component.html',
  styleUrls: ['./instance-table.component.scss']
})
export class InstanceTableComponent {
  private readonly _router = inject(EnvRouter);

  displayedColumns: string[] = ['version', 'branch', 'start', 'duree'];
  dataSource: MatTableDataSource<AbstractStage> = new MatTableDataSource();
  dateNow = new Date().getTime();
  versionColor: any;

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() mainId='';
  @Input() set requests(requests: AbstractStage[]) {
    if(requests) {
      this.dataSource = new MatTableDataSource(requests);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.sort.active = 'start'; // id de la colonne (matColumnDef)
      this.dataSource.sort.direction = 'desc';
      this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
      this.dataSource.sort.sortChange.emit({
        active: this.sort.active,
        direction: this.sort.direction
      });
      this.versionColor = groupByColor(requests, (v: any) => v.version)
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }
  goToDetail(event: MouseEvent,row: any) {
    this._router.navigateOnClick(event, ['/instance/detail', row.id], {       queryParamsHandling: 'preserve'});

  }

  sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;
    return row[columnName as keyof any] as string;
  }
}
