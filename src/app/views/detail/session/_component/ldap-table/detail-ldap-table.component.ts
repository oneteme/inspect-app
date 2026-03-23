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
  tableConfig: TableProvider<DirectoryRequestDto> = {
    ...LDAP_REQUEST_TABLE_CONFIG,
    onRowSelected: (row: DirectoryRequestDto, event: MouseEvent) => this.selectedRequest(event, row.id)
  };

  _requests: DirectoryRequestDto[] = [];

  @Input() set requests(requests: DirectoryRequestDto[]) {
    this._requests = requests;
  }

  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: string }> = new EventEmitter();

  selectedRequest(event: MouseEvent, row: string) {
    this.onClickRow.emit({event: event, row: row});
  }
}