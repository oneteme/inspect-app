import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'exceptions-table-new',
  templateUrl: './exceptions-table.component.html',
  styleUrls: ['./exceptions-table.component.scss'],
})
export class ExceptionsTableComponent {
  displayedColumns: string[] = ['date', 'errorType', 'count'];
  dataSource: MatTableDataSource<{ date: string, errorType: string, count: number, countok: number }> = new MatTableDataSource([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  @Input() isLoading: boolean;

  removePackage(errorType: string) {
    const index = errorType.lastIndexOf('.') + 1;
    return errorType?.substring(index);
  }
}