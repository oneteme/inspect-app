import {Component, EventEmitter, Input, OnDestroy, Output} from "@angular/core";
import {RestRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {REST_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'rest-table',
  templateUrl: './detail-rest-table.component.html',
  styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent {
  tableConfig: TableProvider<RestRequestDto> = {
    ...REST_REQUEST_TABLE_CONFIG,
    onRowSelected: (row, event) => this.selectedRequest(event, row.id)
  };

  _requests: RestRequestDto[] = [];

  @Input() isLoading: boolean;

  @Input() set requests(requests: RestRequestDto[]) {
    this._requests = requests;
  }

  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();
  @Output() onClickRemote: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();

  selectedRemote(event: MouseEvent, row: string) {
    this.onClickRemote.emit({event: event, row: row});
  }

  selectedRequest(event: MouseEvent, row: string) {
    this.onClickRow.emit({event: event, row: row});
  }
}
