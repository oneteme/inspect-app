import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {catchError, finalize, of, Subject, takeUntil} from 'rxjs';
import {TableProvider} from '@oneteme/jquery-table';
import {DatabaseRequestService} from '../../../../service/jquery/database-request.service';
import {DatabaseTableInfo} from '../../../../model/request.model';
import {DATABASE_MODAL_TABLE} from "../../../../shared/_component/table/table.config";

@Component({
  templateUrl: './database-info-modal.component.html',
  styleUrls: ['./database-info-modal.component.scss']
})
export class DatabaseInfoModalComponent implements OnInit, OnDestroy {
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _destroy$ = new Subject<void>();

  tables: DatabaseTableInfo[] = [];
  isLoading = true;

  readonly tableConfig: TableProvider<DatabaseTableInfo> = DATABASE_MODAL_TABLE;

  ngOnInit(): void {
    this._databaseRequestService.getDatabaseTablesInfo().pipe(
        catchError(() => of([])),
        finalize(() => this.isLoading = false),
        takeUntil(this._destroy$)
    ).subscribe(tables => this.tables = tables);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}