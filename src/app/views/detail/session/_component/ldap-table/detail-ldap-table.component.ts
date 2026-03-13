import {Component, EventEmitter, Input, Output} from "@angular/core";
import {DirectoryRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';
import {LDAP_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'ldap-table',
  templateUrl: './detail-ldap-table.component.html',
  styleUrls: ['./detail-ldap-table.component.scss']
})
export class DetailLdapTableComponent {
  tableConfig: TableProvider<DirectoryRequestDto> = LDAP_REQUEST_TABLE_CONFIG;

  _requests: DirectoryRequestDto[] = [];

  @Input() set requests(requests: DirectoryRequestDto[]) {
    if (requests) {
      this._requests = requests
    }
  }

  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();

  selectedRequest(event: MouseEvent, row: any) {
    this.onClickRow.emit({event: event, row: row});
  }
}