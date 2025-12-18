import {Component, Input, ViewChild} from "@angular/core";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {AbstractStage, HttpSessionStage, Mail} from "../../../../../model/trace.model";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {INFINITY} from "../../../../constants";

@Component({
  selector: 'request-mail-table',
  templateUrl: './request-mail-table.component.html',
  styleUrls: ['./request-mail-table.component.scss']
})
export class RequestMailTableComponent {
  displayedColumns: string[] = ['subject', 'from', 'recipients', 'replyTo'];
  dataSource: MatTableDataSource<Mail> = new MatTableDataSource();

  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sort', {static: true}) sort: MatSort;

  @Input() set mails(mails: Mail[]) {
    if(mails) {
      this.dataSource = new MatTableDataSource(mails);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }
}