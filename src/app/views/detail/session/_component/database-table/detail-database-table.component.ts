import {Component, EventEmitter, Input, Output} from "@angular/core";
import {DatePipe} from "@angular/common";
import {INFINITY} from "../../../../constants";
import {DatabaseRequestDto} from "../../../../../model/request.model";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'database-table',
  templateUrl: './detail-database-table.component.html',
  styleUrls: ['./detail-database-table.component.scss']
})
export class DetailDatabaseTableComponent {
  private readonly pipe = new DatePipe('fr-FR');

  tableConfig: TableProvider<DatabaseRequestDto> = {
    columns: [
      { key: 'host', header: 'Hôte', icon: 'dns' },
      { key: 'command', header: 'Ressource', icon: 'category' },
      { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', sliceable: false, groupable: false },
      { key: 'user', header: 'Utilisateur', icon: 'person', optional: true },
      { key: 'failed', header: 'Statut', optional: true, value: (row) => row.failed ? 'KO' : 'OK' },
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
    rowClass: (row: DatabaseRequestDto) => {
      const failed = row.failed;
      if(row.end == null) return '';
      if (failed) return 'row-ko';
      if (!failed) return 'row-ok';
    }
  };

  _requests: DatabaseRequestDto[] = [];

  @Input() set requests(requests: DatabaseRequestDto[]) {
    if (requests) {
      this._requests = requests;
    }
  }

  @Input() isLoading: boolean;
  @Output() onClickRow: EventEmitter<{ event: MouseEvent, row: any }> = new EventEmitter();

  selectedQuery(event: MouseEvent, row: number) {
    this.onClickRow.emit({event: event, row: row});
  }

  filterPredicate = (data: DatabaseRequestDto, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let date = new Date(data.start * 1000)
    let isMatch = true;
    for (let [key, value] of map.entries()) {
      if (key == 'filter') {
        isMatch = isMatch && (value == '' ||
          (data.host?.toLowerCase().includes(value) ||
            data.name?.toLowerCase().includes(value) ||
            data.schema?.toLowerCase().includes(value) ||
            data.command?.toLowerCase().includes(value) ||
            this.pipe.transform(date, "dd/MM/yyyy").toLowerCase().includes(value) ||
            this.pipe.transform(date, "HH:mm:ss.SSS").toLowerCase().includes(value) ||
            (!data.failed && value.toLowerCase() == 'ok') || (data.failed && value.toLowerCase() == 'ko') ||
            data.exception?.message?.toString().toLowerCase().includes(value) ||
            data.exception?.type?.toString().toLowerCase().includes(value)
          ));
      }
    }
    return isMatch;
  }

  sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "start") return row['start'] as string;
    if (columnName == "duree") return row['end'] ? row["end"] - row["start"] : INFINITY;
    return row[columnName as keyof any] as string;
  }
}
