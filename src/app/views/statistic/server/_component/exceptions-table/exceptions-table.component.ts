import {Component, EventEmitter, inject, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DecimalPipe} from "@angular/common";
import {DEFAULT_TABLE_CONFIG, DEPLOIEMENT_TABLE_CONFIG} from "../../../../../shared/_component/table/table.config";
import {TableProvider} from "@oneteme/jquery-table";
import {LastServerStart} from "../../../../../model/jquery.model";

@Component({
  selector: 'exceptions-table',
  templateUrl: './exceptions-table.component.html',
  styleUrls: ['./exceptions-table.component.scss'],
})
export class ExceptionsTableComponent {
  private _decimalPipe = inject(DecimalPipe);

  readonly tableConfig: TableProvider<{ stringDate: string, date: number, year: number, errorType: string, count: number, countok: number }> = {
    ...DEFAULT_TABLE_CONFIG,
    view: { enabled: false },
    columns: [
      { key: 'stringDate', header: 'Instant', icon: 'schedule', groupable: false, sliceable: false },
      { key: 'errorType', header: 'Exception', icon: 'error', groupable: false, sliceable: false, value: (row) => this.removePackage(row.errorType) },
      { key: 'percent', header: 'Taux', icon: 'percent', groupable: false, sliceable: false,
        sortValue: (row) => parseFloat(this._decimalPipe.transform((row['count'] * 100) / row['countok'] , '1.0-2', 'en_US') || '0')
      }
    ],
    defaultSort: {active: 'stringDate', direction: 'desc'}
  };

  _requests: { stringDate: string, date: number, year: number, errorType: string, count: number, countok: number }[] = [];
  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this._requests = objects;
    }
  }

  @Input() isLoading: boolean;
  @Output() onRowSelected = new EventEmitter<any>();

  removePackage(errorType: string) {
    const index = errorType.lastIndexOf('.') + 1;
    return errorType?.substring(index);
  }

  selectedRow(event: MouseEvent, row: any) {
    this.onRowSelected.emit(row);
  }
}