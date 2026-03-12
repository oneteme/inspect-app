import {Component, Input} from "@angular/core";
import {HttpSessionStage} from "../../../../../model/trace.model";
import {INFINITY} from "../../../../constants";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'stage-table',
  templateUrl: './detail-stage-table.component.html',
  styleUrls: ['./detail-stage-table.component.scss']
})
export class DetailStageTableComponent {
  tableConfig: TableProvider<HttpSessionStage> = {
    columns: [
      { key: 'name', header: 'Evènement', icon: 'event_list', sliceable: false, groupable: false },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', sliceable: false, groupable: false }
    ],
    enableSearchBar: true,
    enableViewButton: true,
    allowColumnRemoval: true,
    enablePagination: true,
    pageSize: 10,
    enableColumnDragDrop: false,
    pageSizeOptions: [5, 10, 15, 20, 100],
    pageSizeOptionsGroupBy: [20, 50, 100, 200],
    emptyStateLabel: 'Aucun résultat',
    loadingStateLabel: 'Chargement des requêtes...'
  };

  _requests: HttpSessionStage[] = [];

  @Input() set requests(requests: HttpSessionStage[]) {
    if(requests) {
      this._requests = requests;
    }
  }

  sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;

    return row[columnName as keyof any] as string;
  }
}