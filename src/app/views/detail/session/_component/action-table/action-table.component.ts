import {Component, Input} from "@angular/core";
import {ANALYTIC_MAPPING} from "../../../../constants";
import {UserAction} from "../../../../../model/trace.model";
import {TableProvider} from '@oneteme/jquery-table';

@Component({
  selector: 'action-table',
  templateUrl: './action-table.component.html',
  styleUrls: ['./action-table.component.scss']
})
export class ActionTableComponent {
  protected readonly ANALYTIC_MAPPING = ANALYTIC_MAPPING;

  tableConfig: TableProvider<UserAction> = {
    columns: [
      {key: 'type', header: 'Type'},
      {key: 'nodeName', header: 'Tag'},
      {key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false},
      {key: 'name', header: 'Nom'},
      {key: 'user', header: 'Utilisateur', optional: true},
    ],
    search: { enabled: true },
    view: { enabled: true, enableColumnRemoval: true },
    pagination: { enabled: true, pageSize: 10, pageSizeOptions: [5, 10, 15, 20, 100], pageSizeOptionsGroupBy: [20, 50, 100, 200] },
    labels: { empty: 'Aucun résultat', loading: 'Chargement des requêtes...' }
  };

  _requests: UserAction[] = [];

  @Input() set requests(requests: UserAction[]) {
    this._requests = requests;
  }
}