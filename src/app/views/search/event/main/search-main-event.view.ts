import {Component, OnInit, inject} from '@angular/core';
import {finalize} from 'rxjs';
import {TraceService} from '../../../../service/trace.service';
import {TableProvider} from "@oneteme/jquery-table";
import {HttpErrorResponse} from "@angular/common/http";
import {SessionEventDto} from "../../../../model/request.model";
import {SESSION_EVENT_TABLE_CONFIG} from "../../../../shared/_component/table/table.config";

@Component({
  templateUrl: './search-main-event.view.html',
  styleUrls: ['./search-main-event.view.scss']
})
export class SearchMainEventView implements OnInit {
  private readonly _traceService = inject(TraceService);

  tableConfig: TableProvider<SessionEventDto> = SESSION_EVENT_TABLE_CONFIG;
  events: SessionEventDto[];
  isLoading = false;

  ngOnInit() {
    this.getEvents();
  }

  getEvents() {
    this.isLoading = true;
    this.events = [];
    this._traceService.getSessionEvents({})
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: d => {
            this.events = d;
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 413) {
              this.tableConfig.labels.empty = error.error.message;
            }
          }
        });
  }
}
