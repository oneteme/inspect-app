import {Component, EventEmitter, Input, Output} from "@angular/core";
import {MailRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {SMTP_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'smtp-table',
  templateUrl: './detail-smtp-table.component.html',
  styleUrls: ['./detail-smtp-table.component.scss']
})
export class DetailSmtpTableComponent {
  tableConfig: TableProvider<MailRequestDto> = {
    ...SMTP_REQUEST_TABLE_CONFIG,
    onRowSelected:  (row, event) => this.selectedRequest(event, row.id)
  };

  _requests: MailRequestDto[] = [];

  @Input() set requests(requests: MailRequestDto[]) {
    this._requests = requests;
  }

  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();

  selectedRequest(event: MouseEvent, row: string) {
    this.onClickRow.emit({event: event, row: row});
  }
}