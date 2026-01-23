import {Component, inject, Input, ViewChild} from '@angular/core';
import {DecimalPipe} from "@angular/common";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-dependency-table-request-http',
  templateUrl: './dependency-table-request-http.component.html',
  styleUrls: ['./dependency-table-request-http.component.scss']
})
export class DependencyTableRequestHttpComponent {
  private _decimalPipe = inject(DecimalPipe);

  displayedColumns: string[] = ['appName', 'success', 'errorClient', 'errorServer', 'unavailableServer'];
  dataSource: MatTableDataSource<{ appName: string, type: string, count: number, countSucces: number, countErrClient: number, countErrServer: number, countServerUnavailableRows: number }> = new MatTableDataSource([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  @Input()
  hideClientErr=false;

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "success") return parseFloat(this._decimalPipe.transform((row['countSucces'] / row['count']) * 100, '1.0-2', 'en_US'));
        if (columnName == "errorClient") return parseFloat(this._decimalPipe.transform((row['countErrClient'] / row['count']) * 100, '1.0-2', 'en_US'));
        if (columnName == "errorServer") return parseFloat(this._decimalPipe.transform((row['countErrServer'] / row['count']) * 100, '1.0-2', 'en_US'));
        if (columnName == "countServerUnavailableRows") return parseFloat(this._decimalPipe.transform((row['countServerUnavailableRows'] / row['count']) * 100, '1.0-2', 'en_US'));
        return row[columnName as keyof any] as string;
      };
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  @Input() isLoading: boolean;
}
