import {Component, EventEmitter, inject, Input, Output, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DecimalPipe} from "@angular/common";
import {DEFAULT_TABLE_CONFIG, DEPLOIEMENT_TABLE_CONFIG} from "../table.config";
import {TableProvider} from "@oneteme/jquery-table";
import {LastServerStart} from "../../../../model/jquery.model";
import {Constants} from "../../../../views/constants";

@Component({
  selector: 'exceptions-table',
  templateUrl: './exceptions-table.component.html',
  styleUrls: ['./exceptions-table.component.scss'],
})
export class ExceptionsTableComponent {
  private _decimalPipe = inject(DecimalPipe);

  tableConfig: TableProvider<{ stringDate: string, date: number, year: number, errorType: string, count: number, countok: number }> = {
    ...DEFAULT_TABLE_CONFIG,
    columns: [
      { key: 'stringDate', header: 'Instant', icon: 'schedule', groupable: false, sliceable: false },
      { key: 'errorType', header: 'Exception', icon: 'error_outline', groupable: false, sliceable: false, value: (row) => this.removePackage(row.errorType) },
      { key: 'percent', header: 'Taux', icon: 'percent', groupable: false, sliceable: false,
        sortValue: (row) => parseFloat(this._decimalPipe.transform((row['count'] * 100) / row['countok'] , '1.0-2', 'en_US') || '0')
      }
    ],
    defaultSort: {active: 'stringDate', direction: 'desc'},
    onRowSelected: (row, event) => this.selectedRow(event, row)
  };

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  _requests: { stringDate: string, date: number, year: number, errorType: string, count: number, countok: number }[] = [];

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this._requests = objects;
    }
  }

  @Input() set enableTypeColumn(value: boolean) {
    if(value) {
      this.tableConfig = {
        ...this.tableConfig,
        columns: [
          ...this.tableConfig.columns,
          { key: 'type', header: 'Type', icon: 'category', value: (row) => row.type == 'SERVER' ? this.MAPPING_TYPE['rest'].title : this.MAPPING_TYPE['batch'].title }
        ]
      }
    }
  }

  @Input() isLoading: boolean;
  @Output() onRowSelected = new EventEmitter<any>();

  removePackage(errorType: string) {
    const index = errorType.lastIndexOf('.') + 1;
    return errorType?.substring(index);
  }

  selectedRow(event: MouseEvent, row: any) {
    this.onRowSelected.emit({row: row, event: event});
  }
}
