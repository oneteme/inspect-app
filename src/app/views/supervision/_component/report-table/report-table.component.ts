import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {StackTraceRow} from "../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {RestRequestDto} from "../../../../model/request.model";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'report-table',
  templateUrl: 'report-table.component.html'
})
export class ReportTableComponent {

  private readonly pipe = new DatePipe('fr-FR');

  displayedColumns: string[] = ['date', 'level', 'message', 'action'];
  dataSource: MatTableDataSource<{ date: string, level: string, message: string, stacktrace: StackTraceRow[] }> = new MatTableDataSource([]);
  filterTable =new Map<string, any>();
  @Input() filterValue: string = '';
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() useFilter: boolean;
  @Input() isLoading: boolean;
  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects.map(r => {
        return { date: r.date, level: r.level, message: r.message, stacktrace: r.stackRows };
      }));
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      if(this.useFilter){
        this.dataSource.filterPredicate = this.filterPredicate;
        if(this.filterValue){
          this.filterTable.set('filter', this.filterValue.trim().toLowerCase());
          this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
        }
      }
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }
  @Output() onClick: EventEmitter<any> = new EventEmitter();

  onClickStack(row: any) {
    this.onClick.emit(row);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterTable.set('filter', filterValue.trim().toLowerCase());
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterPredicate = (data: { date: string, level: string, message: string, stacktrace: StackTraceRow[] }, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let isMatch = true;
    for (let [key, value] of map.entries()) {
      if (key == 'filter') {
        isMatch = isMatch && (value == '' ||
            (data.level?.toLowerCase().includes(value) ||
                data.message?.toLowerCase().includes(value) ||
                data.date?.includes(value)
            ));
      }
    }
    return isMatch;
  };
}