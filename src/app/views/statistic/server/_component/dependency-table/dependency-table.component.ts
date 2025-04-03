import {Component, inject, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'dependency-table',
  templateUrl: './dependency-table.component.html',
  styleUrls: ['./dependency-table.component.scss'],
})
export class DependencyTableComponent {
  private _decimalPipe = inject(DecimalPipe);

  displayedColumns: string[] = ['appName', 'success', 'errorClient', 'errorServer'];
  dataSource: MatTableDataSource<{ appName: string, type: string, count: number, countSucces: number, countErrClient: number, countErrServer: number }> = new MatTableDataSource([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "success") return parseFloat(this._decimalPipe.transform((row['countSucces'] / row['count']) * 100, '1.0-2', 'en_US'));
        if (columnName == "errorClient") return parseFloat(this._decimalPipe.transform((row['countErrClient'] / row['count']) * 100, '1.0-2', 'en_US'));
        if (columnName == "errorServer") return parseFloat(this._decimalPipe.transform((row['countErrServer'] / row['count']) * 100, '1.0-2', 'en_US'));
        return row[columnName as keyof any] as string;
      };
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  @Input() isLoading: boolean;
}

