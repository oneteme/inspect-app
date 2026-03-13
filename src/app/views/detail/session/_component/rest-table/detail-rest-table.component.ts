import {Component, EventEmitter, Input, OnDestroy, Output} from "@angular/core";
import {RestRequestDto, RestSessionDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'rest-table',
  templateUrl: './detail-rest-table.component.html',
  styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent implements OnDestroy {
  tableConfig: TableProvider<RestRequestDto> = {
    columns: [
      { key: 'host', header: 'Hôte', icon: 'dns' },
      { key: 'resource', header: 'Ressource', icon: 'category' },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
        sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
      },
      { key: 'user', header: 'Utilisateur', icon: 'person' },
      { key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt',
        value: (row: RestSessionDto) => {
          if(!row.end) return 'En cours...';
          return row.status;
        }
      },
      { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline',
        value: (row: RestSessionDto) => {
          return row.exception?.type;
        }
      },
      { key: 'action', header: 'Action', icon: 'touch_app', sliceable: false, groupable: false, sortable: false}
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
      },
      {
        title: 'Méthode',
        columnKey: 'method',
        icon: 'label'
      },
      {
        title: 'Ressource',
        columnKey: 'path',
        icon: 'category'
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
    rowClass: (row: RestSessionDto) => {
      const code = row.status;
      if (code >= 500) return 'row-ko';
      if (code >= 400) return 'row-warning';
      if (code >= 200) return 'row-ok';
      if (code == 0 && row.end) return 'row-unavailable';
      return '';
    }
  };

  _requests: RestRequestDto[] = [];

  @Input() isLoading: boolean;

  @Input() set requests(requests: RestRequestDto[]) {
    if(requests) {
      this._requests = requests;
    }
  }

  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();
  @Output() onClickRemote: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();

  ngOnDestroy() {

  }

  selectedRemote(event: MouseEvent, row: any) {
    this.onClickRemote.emit({event: event, row: row});
  }

  selectedRequest(event: MouseEvent, row: any) {
    this.onClickRow.emit({event: event, row: row});
  }
}
