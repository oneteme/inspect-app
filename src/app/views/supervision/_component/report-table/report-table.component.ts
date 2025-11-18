import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {StackTraceRow} from "../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'report-table',
  templateUrl: 'report-table.component.html'
})
export class ReportTableComponent {
  displayedColumns: string[] = ['date', 'level', 'message', 'action'];
  dataSource: MatTableDataSource<{ date: string, level: string, message: string, stacktrace: StackTraceRow[] }> = new MatTableDataSource([]);

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() isLoading: boolean;
  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects.map(r => {
        return { date: r.date, level: r.level, message: r.message, stacktrace: r.stacktrace };
      }));
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }
  @Output() onClick: EventEmitter<any> = new EventEmitter();

  onClickStack(row: any) {
    this.onClick.emit(row);
  }
}