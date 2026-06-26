import {Component, inject, Input, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {AbstractStage} from "../../../../../model/trace.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {INFINITY} from "../../../../constants";
import {EnvRouter} from "../../../../../service/router.service";
import {groupByColor} from "../../../../../shared/util";
import {
  DEFAULT_SORT_CONFIG,
  DEFAULT_TABLE_CONFIG,
  DEPLOIEMENT_TABLE_CONFIG
} from "../../../../../shared/_component/table/table.config";
import {TableProvider} from "@oneteme/jquery-table";
import {LastServerStart} from "../../../../../model/jquery.model";
import {DatabaseRequestDto} from "../../../../../model/request.model";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'instance-table',
  templateUrl: './instance-table.component.html',
  styleUrls: ['./instance-table.component.scss']
})
export class InstanceTableComponent {
  private readonly _router = inject(EnvRouter);
  private readonly _activatedRoute = inject(ActivatedRoute);

  readonly tableConfig: TableProvider<LastServerStart> = {
    ...DEFAULT_TABLE_CONFIG,
    columns: [
      { key: 'version', header: 'Version', icon: 'label' },
      { key: 'branch',  header: 'Branche', icon: 'fork_right', width: '40%' },
      { key: 'start', header: 'Début', icon: 'schedule', groupable: false, sliceable: false },
      { key: 'duration', header: 'Durée', icon: 'timer', groupable: false, sliceable: false,
        sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
      },
      { key: 'os', header: 'OS', icon: 'computer', optional: true },
      { key: 're', header: 'RE', icon: 'sdk', optional: true },
      { key: 'user', header: 'Utilisateur', icon: 'person', optional: true }
    ],
    defaultSort: DEFAULT_SORT_CONFIG,
    rowClass: (row) => {
      if(row.id == this._activatedRoute.snapshot.params['id_instance']) {
        return 'row-actual';
      }
      return '';
    },
    onRowSelected: (row, event) => this.goToDetail(event, row)
  };

  versionColor: any;
  _requests: LastServerStart[] = [];

  @Input() set requests(requests: LastServerStart[]) {
    if(requests) {
      this._requests = requests;
      this.versionColor = groupByColor(requests, (v: any) => v.version)
    }
  }

  goToDetail(event: MouseEvent,row: any) {
    this._router.navigateOnClick(event, ['/instance/detail', row.id], { queryParamsHandling: 'preserve'});
  }
}
