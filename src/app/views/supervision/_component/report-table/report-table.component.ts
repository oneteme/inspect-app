import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {LogEntry, StackTraceRow} from "../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {RestRequestDto} from "../../../../model/request.model";
import {DatePipe} from "@angular/common";
import {INFINITY} from "../../../constants";

@Component({
  selector: 'report-table',
  styleUrls: ['./report-table.component.scss'],
  templateUrl: 'report-table.component.html'
})
export class ReportTableComponent {
  private pipe = new DatePipe('fr-FR');

  displayedColumns: string[] = ['instant', 'message', 'action'];
  dataSource: MatTableDataSource<LogEntry> = new MatTableDataSource([]);
  filterTable =new Map<string, any>();
  @Input() filterValue: string = '';
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() useFilter: boolean;
  @Input() isLoading: boolean;
  @Input() set data(objects: LogEntry[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
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

  filterPredicate = (data: LogEntry, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let isMatch = true;
    for (let [key, value] of map.entries()) {
      if (key == 'filter') {
        isMatch = isMatch && (value == '' ||
            (data.level?.toLowerCase().includes(value) ||
              data.message?.toLowerCase().includes(value) ||
              this.pipe.transform(data.instant,"dd/MM/yyyy").toLowerCase().includes(value) ||
              this.pipe.transform(data.instant,"HH:mm:ss.SSS").toLowerCase().includes(value)
            ));
      }
    }
    return isMatch;
  };
}