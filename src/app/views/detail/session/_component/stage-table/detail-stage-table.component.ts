import {Component, Input} from "@angular/core";
import {HttpSessionStage} from "../../../../../model/trace.model";
import {TableProvider} from '@oneteme/jquery-table';
import {STAGE_SESSION_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";

@Component({
  selector: 'stage-table',
  templateUrl: './detail-stage-table.component.html',
  styleUrls: ['./detail-stage-table.component.scss']
})
export class DetailStageTableComponent {
  tableConfig: TableProvider<HttpSessionStage> = STAGE_SESSION_TABLE_CONFIG;

  _requests: HttpSessionStage[] = [];

  @Input() set requests(requests: HttpSessionStage[]) {
    if(requests) {
      this._requests = requests;
    }
  }
}