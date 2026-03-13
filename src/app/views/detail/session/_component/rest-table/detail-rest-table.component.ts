import {Component, EventEmitter, Input, OnDestroy, Output} from "@angular/core";
import {RestRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {REST_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'rest-table',
  templateUrl: './detail-rest-table.component.html',
  styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent implements OnDestroy {
  tableConfig: TableProvider<RestRequestDto> = REST_REQUEST_TABLE_CONFIG;

  _requests: RestRequestDto[] = [];

  @Input() isLoading: boolean;

  @Input() set requests(requests: RestRequestDto[]) {
    if(requests) {
      this._requests = requests;
    }
  }

  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();
  @Output() onClickRemote: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();

  ngOnDestroy() {

  }

  selectedRemote(event: MouseEvent, row: any) {
    this.onClickRemote.emit({event: event, row: row});
  }

  selectedRequest(event: MouseEvent, row: any) {
    this.onClickRow.emit({event: event, row: row});
  }
}
