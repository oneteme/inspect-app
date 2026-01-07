import {Component, Input, ViewChild} from "@angular/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'parameter-table',
  templateUrl: './parameter-table.component.html',
  styleUrls: ['./parameter-table.component.scss']
})
export class ParameterTableComponent {

  displayedColumns: string[] = ['key', 'value'];
  dataSource: MatTableDataSource<{ key: string; value: any }> = new MatTableDataSource();

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() set data(requests: { key: string; value: any }[]) {
    if(requests) {
      this.dataSource = new MatTableDataSource(requests);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }
}