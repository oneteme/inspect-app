import {Component, EventEmitter, Input, Output, ViewEncapsulation} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {STATUS} from "../../../../constants";

@Component({
  selector: 'dashboard-detail-view-new',
  templateUrl: './detail-view-new.component.html',
  styleUrls: ['./detail-view-new.component.scss'],
})
export class DashboardDetailViewNewComponent {

  protected readonly Status = STATUS;

  readonly CHART_CONFIG: ChartProvider<string, number> = {
    continue: true,
    series: [
      { data: { x: field('date'), y: field('count') }, name: 'Exceptions', color: "#ff0000" }
    ],
    options: {
      legend: { show: false },
      yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
      series: [{ smooth: true }],
      tooltip: {
        formatter: (params: any[]) => {
          const p = params[0];
          if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
          const val = Array.isArray(p.value) ? p.value[1] : p.value;
          return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
        }
      }
    }
  };
  _selectedSummary:  {category: string, type: string, date: string, year: number, label: string, count: number, countTotal: number}[] = [];
  _selectedSummaryGrouped: {category: string, type: string, label: string, count: number, totalCount: number}[] = [];

  @Input() isLoading: boolean;
  @Input() set selectedSummary(value: {category: string, type: string, date: string, year: number, label: string, count: number, countTotal: number}[]) {
      this._selectedSummary = value ?? [];
      this._selectedSummaryGrouped = this.groupByType(this._selectedSummary);
  };
  @Output() onNavigateSearch = new EventEmitter<{event: MouseEvent; row: {category: string, type: string, label: string, count: number, totalCount: number} }>();

  private groupByType(value: {category: string, type: string, date: string, year: number, label: string, count: number, countTotal: number}[]): {category: string, type: string, label: string, count: number, totalCount: number}[] {
    if (!value.length) return [];

    const {category, type} = value[0];
    const grouped = new Map<string, number>();
    let totalCount = 0;
    for (const {label, count} of value) {
      grouped.set(label, (grouped.get(label) ?? 0) + count);
      totalCount += count;
    }
    return Array.from(grouped, ([label, count]) => ({category, type, label, count, totalCount})).sort((a, b) => b.count - a.count);
  }
}