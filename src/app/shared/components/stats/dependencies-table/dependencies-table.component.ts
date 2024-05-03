import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { ChartProvider, field, values } from "@oneteme/jquery-core";

@Component({
    selector: 'dependencies-table',
    templateUrl: './dependencies-table.component.html',
    styleUrls: ['./dependencies-table.component.scss'],
})
export class DependenciesTableComponent {

    displayedColumns: string[] = ['name', 'response'];
    dataSource: MatTableDataSource<{ name: string, count: number, data: any[] }> = new MatTableDataSource([]);

    readonly CONFIG_SPARKLINE: ChartProvider<string, number> = {
        height: 50,
        width: 50,
        series: [
            {data: {x: values('2xx'), y: field('countSucces')}, name: 'mapper 1', color: '#33cc33'},
            {data: {x: values('4xx'), y: field('countErrClient')}, name: 'mapper 2', color: '#ffa31a'},
            {data: {x: values('5xx'), y: field('countErrServer')}, name: 'mapper 3', color: '#ff0000'}
        ],
        options: {
            chart: {
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            value: {
                                fontSize: '9px',
                                offsetY: -12
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: ''
                            }
                        }
                    }
                }
            },
            tooltip: {
                enabled: true,
                fixed: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            }
        }
    };

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                return { name: r.name, count: r.count, data: [r] };
            }));
            this.dataSource.paginator = this.paginator;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;

    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    onClick(event:MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }
}