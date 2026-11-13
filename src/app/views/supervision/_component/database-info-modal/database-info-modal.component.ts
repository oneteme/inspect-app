import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {Subject, takeUntil, catchError, of, finalize} from 'rxjs';
import {DatabaseRequestService} from '../../../../service/jquery/database-request.service';
import {DatabaseTableInfo} from '../../../../model/request.model';

@Component({
  templateUrl: './database-info-modal.component.html',
  styleUrls: ['./database-info-modal.component.scss']
})
export class DatabaseInfoModalComponent implements OnInit, OnDestroy {
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _destroy$ = new Subject<void>();

  tables: DatabaseTableInfo[] = [];
  isLoading = true;

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