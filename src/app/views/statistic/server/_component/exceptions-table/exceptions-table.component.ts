import {Component, EventEmitter, inject, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'exceptions-table-new',
  templateUrl: './exceptions-table.component.html',
  styleUrls: ['./exceptions-table.component.scss'],
})
export class ExceptionsTableComponent {
  private _decimalPipe = inject(DecimalPipe);

  displayedColumns: string[] = ['stringDate', 'errorType', 'count'];
  dataSource: MatTableDataSource<{ stringDate: string, date: number, year: number, errorType: string, count: number, countok: number }> = new MatTableDataSource([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "stringDate") { return row['date'] }
        if (columnName == "count") return parseFloat(this._decimalPipe.transform((row['count'] * 100) / row['countok'] , '1.0-2', 'en_US'));
        if (columnName == "errorType") return this.removePackage(row['errorType']);
        return row[columnName as keyof any] as string;
      };
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  @Input() isLoading: boolean;
  @Output() onRowSelected = new EventEmitter<any>();

  removePackage(errorType: string) {
    const index = errorType.lastIndexOf('.') + 1;
    return errorType?.substring(index);
  }

  selectedRow(event: MouseEvent, row: any) {
    this.onRowSelected.emit(row);
  }

}