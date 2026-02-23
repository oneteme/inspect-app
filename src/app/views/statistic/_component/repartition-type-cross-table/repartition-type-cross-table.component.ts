import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import {TableColumn} from "../dynamic-table/dynamic-table.component";

export interface ProgressSegment {
    field: string;
    label: string;
    color: string;
}

@Component({
    selector: 'repartition-cross-table',
    templateUrl: './repartition-type-cross-table.component.html',
    styleUrls: ['./repartition-type-cross-table.component.scss'],
})
export class RepartitionTypeCrossTableComponent {
    displayedColumns: string[] = [];
    dataSource: MatTableDataSource<any> = new MatTableDataSource([]);
    _columns: TableColumn[] = [];
    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() title: string;
    @Input() segments: ProgressSegment[] = [];
    @Input() set columns(cols: TableColumn[]) {
        if (cols?.length) {
            this._columns = cols;
            this.displayedColumns = [...cols.map(c => c.field), 'progress'];
        }
    }

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                const total = this.segments.reduce((sum, seg) => sum + (r[seg.field] || 0), 0);
                return {
                    ...r,
                    total: total,
                    data: [r]
                };
            }));
            this.dataSource.paginator = this.paginator;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;

    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    onClick(event: MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }

    getPercentage(element: any, field: string): number {
        if (!element.total || element.total === 0) return 0;
        return (element[field] / element.total) * 100;
    }
}