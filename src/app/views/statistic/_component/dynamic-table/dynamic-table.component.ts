import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";

export interface TableColumn {
  field: string;
  header: string;
  width?: string;
}

@Component({
  selector: 'dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
})
export class DynamicTableComponent {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource([]);
  selectedRowData: any = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  _columns: TableColumn[] = [];

  @Input() title: string;
  @Input() keepHighlightedRow: boolean = false;
  @Input() cursorPointer: boolean = true;
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
  @Input() pageSize: number = 5;

  @Output() rowSelected = new EventEmitter<any>();

  selectedRow(event: MouseEvent, row: any) {
    if (this.keepHighlightedRow) {
      // Toggle selection: deselect if already selected
      this.selectedRowData = this.selectedRowData === row ? null : row;
    } else {
      // Clear selection if keepHighlightedRow is false
      this.selectedRowData = null;
    }
    this.rowSelected.emit(this.selectedRowData);
  }
}

