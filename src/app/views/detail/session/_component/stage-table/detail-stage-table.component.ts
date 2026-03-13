import {Component, Input} from "@angular/core";
import {HttpSessionStage} from "../../../../../model/trace.model";
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
      { key: 'duration', header: 'Durée', icon: 'timer', groupable: false },
      { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
        value: (row) => !row.end ? 'En cours...' : row.exception ? 'KO' : 'OK'
      },
      { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
    ],
    slices: [
      {
        title: 'Durée',
        columnKey: 'duration',
        categories: [
          { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
          { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
          { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
          { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
          { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
          { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
        ]
      }
    ],
    defaultSort: { active: 'start', direction: 'desc' },
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
    rowClass: (row: HttpSessionStage) => {
      const failed = row.exception;
      if(row.end == null) return '';
      if (failed) return 'row-ko';
      if (!failed) return 'row-ok';
    }
  };

  _requests: HttpSessionStage[] = [];

  @Input() set requests(requests: HttpSessionStage[]) {
    if(requests) {
      this._requests = requests;
    }
  }
}