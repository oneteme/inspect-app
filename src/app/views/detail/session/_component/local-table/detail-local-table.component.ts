import {Component, Input} from "@angular/core";
import {LocalRequest} from "../../../../../model/trace.model";
import {INFINITY} from "../../../../constants";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'local-table',
  templateUrl: './detail-local-table.component.html',
  styleUrls: ['./detail-local-table.component.scss']
})
export class DetailLocalTableComponent {
  displayedColumns: string[] = ['location', 'name', 'start', 'duree', 'user'];

  tableConfig: TableProvider<LocalRequest> = {
    columns: [
      { key: 'host', header: 'Hôte', icon: 'dns' },
      { key: 'command', header: 'Ressource', icon: 'category' },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', sliceable: false, groupable: false },
      { key: 'user', header: 'Utilisateur', icon: 'person', optional: true },
      { key: 'failed', header: 'Statut', optional: true, value: (row) => row.exception ? 'KO' : 'OK' },
      { key: 'exception', header: 'Exception', optional: true, value: (row) => row.exception?.type }
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
    loadingStateLabel: 'Chargement des requêtes...',
    rowClass: (row: LocalRequest) => {
      const failed = row.exception;
      if(row.end == null) return '';
      if (failed) return 'row-ko';
      if (!failed) return 'row-ok';
    }
  };

  _requests: LocalRequest[] = [];

  @Input() set requests(requests: LocalRequest[]) {
    if (requests) {
      this._requests = requests;
    }
  }
}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "location") return row["location"] as string;
  if (columnName == "start") return row['start'] as string;
  if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;
  return row[columnName as keyof any] as string;
}