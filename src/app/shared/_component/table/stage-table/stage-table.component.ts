import {Component, Input} from "@angular/core";
import {AbstractStage} from "../../../../model/trace.model";
import {TableProvider} from '@oneteme/jquery-table';
import {STAGE_TABLE_CONFIG} from "../table.config";

@Component({
  selector: 'stage-table',
  templateUrl: './stage-table.component.html',
  styleUrls: ['./stage-table.component.scss']
})
export class StageTableComponent {
  tableConfig: TableProvider<AbstractStage> = STAGE_TABLE_CONFIG;

  _requests: AbstractStage[] = [];

  @Input() set requests(requests: AbstractStage[]) {
    this._requests = requests;
  }
}