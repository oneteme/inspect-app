import {Component, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'dependency-table',
  templateUrl: './dependency-table.component.html',
  styleUrls: ['./dependency-table.component.scss'],
})
export class DependencyTableComponent {
  displayedColumns: string[] = ['appName', 'success', 'errorClient', 'errorServer'];
  dataSource: MatTableDataSource<{ appName: string, type: string, count: number, countSucces: number, countErrClient: number, countErrServer: number }> = new MatTableDataSource([]);

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
}