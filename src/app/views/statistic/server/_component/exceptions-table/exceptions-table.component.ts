import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

export interface TableColumn {
  field: string;
  header: string;
  width?: string;
}

@Component({
  selector: 'exceptions-table-new',
  templateUrl: './exceptions-table.component.html',
  styleUrls: ['./exceptions-table.component.scss'],
})
export class ExceptionsTableComponent {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  _columns: TableColumn[] = [];

  @Input() set columns(cols: TableColumn[]) {
    if (cols?.length) {
      this._columns = cols;
      this.displayedColumns = cols.map(c => c.field);
    }
  }

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
  @Output() onRowSelected = new EventEmitter<any>();

  selectedRow(event: MouseEvent, row: any) {
    this.onRowSelected.emit(row);
  }
}}
