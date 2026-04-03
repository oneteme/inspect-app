import {Component, EventEmitter, Input, Output} from "@angular/core";
import {FtpRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {FTP_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'ftp-table',
  templateUrl: './detail-ftp-table.component.html',
  styleUrls: ['./detail-ftp-table.component.scss']
})
export class DetailFtpTableComponent {
  tableConfig: TableProvider<FtpRequestDto> = {
    ...FTP_REQUEST_TABLE_CONFIG,
    onRowSelected: (row: FtpRequestDto, event: MouseEvent) => this.selectedRequest(event, row.id)
  };

  _requests: FtpRequestDto[] = [];

  @Input() set requests(requests: FtpRequestDto[]) {
    this._requests = requests;
  }

  @Input() isLoading: boolean;
  @Input() set initialSearch(value: string) {
    this.tableConfig = {
      ...this.tableConfig,
      search: { ...this.tableConfig?.search, initialQuery: value }
    }
  }

  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();

  selectedRequest(event: MouseEvent, row: string) {
    this.onClickRow.emit({event: event, row: row});
  }
}