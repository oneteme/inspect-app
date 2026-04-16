import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { TableProvider } from '@oneteme/jquery-table';
import { formatDuration } from 'src/app/shared/pipe/duration.pipe';
import { DEPLOIEMENT_TABLE_CONFIG } from 'src/app/shared/_component/table/table.config';

@Component({
    selector: 'dashboard-instances-table',
  templateUrl: './instances-table.component.html',
  styleUrls: ['./instances-table.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardInstancesTableComponent implements OnChanges {

    tableConfig: TableProvider<any> = {
        ...DEPLOIEMENT_TABLE_CONFIG,
        export: { enabled: true, filename: 'posts' },
        preferences: { enabled: true, tableId: 'instances-table' }
    };

    @Input() rows: any[] = [];
    @Input() isLoading = true;
    @Input() today: Date = new Date();
    @Input() versionColor: Record<string, string> = {};

    @Output() statusIndicatorClick = new EventEmitter<{ event: MouseEvent; row: any }>();
    @Output() serverClick = new EventEmitter<{ event: MouseEvent; row: any }>();
    @Output() sinceClick = new EventEmitter<{ event: MouseEvent; row: any }>();
    @Output() restartClick = new EventEmitter<{ event: MouseEvent; minStart: any; appName: string }>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['today']) {
            const nowMs = this.today.getTime();
            this.tableConfig = {
                ...DEPLOIEMENT_TABLE_CONFIG,
                export: { enabled: true, filename: 'posts' },
                preferences: { enabled: true, tableId: 'instances-table' },
                columns: DEPLOIEMENT_TABLE_CONFIG.columns?.map(col =>
                    col.key === 'duration'
                        ? { ...col, searchValue: (row: any) => formatDuration((nowMs - row.start) / 1000) }
                        : col
                )
            };
        }
    }
}
