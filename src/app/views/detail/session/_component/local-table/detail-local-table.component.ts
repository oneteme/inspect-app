import {Component, Input} from "@angular/core";
import {LocalRequest} from "../../../../../model/trace.model";
import {TableProvider} from '@oneteme/jquery-table';
import {LOCAL_REQUEST_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'local-table',
  templateUrl: './detail-local-table.component.html',
  styleUrls: ['./detail-local-table.component.scss']
})
export class DetailLocalTableComponent {
  tableConfig: TableProvider<LocalRequest> = LOCAL_REQUEST_TABLE_CONFIG;

  _requests: LocalRequest[] = [];

  @Input() set requests(requests: LocalRequest[]) {
    this._requests = requests;
  }
}