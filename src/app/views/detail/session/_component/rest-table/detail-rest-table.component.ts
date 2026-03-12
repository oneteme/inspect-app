import {Component, EventEmitter, inject, Input, OnDestroy, Output} from "@angular/core";
import {EnvRouter} from "../../../../../service/router.service";
import {DatePipe} from "@angular/common";
import {RestRequestDto, RestSessionDto} from "../../../../../model/request.model";
import {INFINITY} from "../../../../constants";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'rest-table',
  templateUrl: './detail-rest-table.component.html',
  styleUrls: ['./detail-rest-table.component.scss']
})
export class DetailRestTableComponent implements OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly pipe = new DatePipe('fr-FR');

  tableConfig: TableProvider<RestRequestDto> = {
    columns: [
      { key: 'host', header: 'Hôte', icon: 'dns' },
      { key: 'path', header: 'Ressource', icon: 'category', sliceable: false,  groupable: false },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', sliceable: false, groupable: false },
      { key: 'user', header: 'Utilisateur', icon: 'person', optional: true },
      { key: 'status', header: 'Statut', optional: true},
      { key: 'exception', header: 'Exception', optional: true, value: (row) => row.exception?.type },
      { key: 'action', header: 'Action', sliceable: false, groupable: false, sortable: false}
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
    this._requests = [];
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

  filterPredicate = (data: RestRequestDto, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let date = new Date(data.start * 1000)
    let isMatch = true;
    for (let [key, value] of map.entries()) {
      if (key == 'filter') {
        isMatch = isMatch && (value == '' ||
          (data.host?.toLowerCase().includes(value) ||
            data.path?.toLowerCase().includes(value) ||
            data.status?.toString().toLowerCase().includes(value) ||
            this.pipe.transform(date, "dd/MM/yyyy").toLowerCase().includes(value) ||
            this.pipe.transform(date, "HH:mm:ss.SSS").toLowerCase().includes(value) ||
            data.exception?.message?.toString().toLowerCase().includes(value) ||
            data.exception?.type?.toString().toLowerCase().includes(value)
          ));
      }
    }
    return isMatch;
  };

  sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "host") return row["host"] + ":" + row["port"] as string;
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;

    return row[columnName as keyof any] as string;
  }
}
