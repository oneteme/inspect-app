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
  tableConfig: TableProvider<MailRequestDto> = SMTP_REQUEST_TABLE_CONFIG;

  _requests: MailRequestDto[] = [];

  @Input() set requests(requests: MailRequestDto[]) {
    if (requests) {
      this._requests = requests;
    }
  }

  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();

  selectedRequest(event: MouseEvent, row: any) {
    this.onClickRow.emit({event: event, row: row});
  }
}