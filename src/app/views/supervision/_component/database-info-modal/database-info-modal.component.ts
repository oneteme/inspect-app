import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {Subject, takeUntil, catchError, of, finalize} from 'rxjs';
import {TableProvider} from '@oneteme/jquery-table';
import {DatabaseRequestService} from '../../../../service/jquery/database-request.service';
import {DatabaseTableInfo} from '../../../../model/request.model';
import {DEFAULT_TABLE_CONFIG} from '../../../../shared/_component/table/table.config';
import {parseSizeToBytes} from '../../../../shared/util';

/** Vue de DatabaseTableInfo avec la taille normalisée en octets (nombre), pour un tri jquery-table correct. */
interface DatabaseTableRow extends Omit<DatabaseTableInfo, 'size'> {
  size: number;
}

@Component({
  templateUrl: './database-info-modal.component.html',
  styleUrls: ['./database-info-modal.component.scss']
})
export class DatabaseInfoModalComponent implements OnInit, OnDestroy {
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _destroy$ = new Subject<void>();

  tables: DatabaseTableRow[] = [];
  isLoading = true;

  readonly tableConfig: TableProvider<DatabaseTableRow> = {
    ...DEFAULT_TABLE_CONFIG,
    view: { enabled: false },
    columns: [
      { key: 'table_name', header: 'Nom de la table', icon: 'table_chart' },
      {
        key: 'size',
        header: 'Volume',
        icon: 'storage',
        value: (row: DatabaseTableRow) => `${row.size.toLocaleString('fr-FR')}`,
        sortValue: (row: DatabaseTableRow) => row.size
      }
    ]
  };

  ngOnInit(): void {
    this._databaseRequestService.getDatabaseTablesInfo().pipe(
        catchError(() => of([])),
        finalize(() => this.isLoading = false),
        takeUntil(this._destroy$)
    ).subscribe(tables => this.tables = tables.map(table => ({
      ...table,
      size: parseSizeToBytes(table.size)
    })));
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}