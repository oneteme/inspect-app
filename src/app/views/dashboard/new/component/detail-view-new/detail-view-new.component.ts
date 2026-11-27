import {Component, EventEmitter, Input, Output, ViewEncapsulation} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {STATUS} from "../../../../constants";
import {SummaryOverview} from "../../dashboard-new.component";

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
      { data: { x: field('date'), y: field('count') }, color: "#ff0000" }
    ],
    options: {
      backgroundColor: 'transparent',
      grid: { top: 16, bottom: 48, left: 8, right: 16, containLabel: true },
      xAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { rotate: 30, overflow: 'truncate', width: 120, fontSize: 11, interval: 'auto' }
      },
      yAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 11, color: '#94a3b8' }
      },
      tooltip: {
        borderRadius: 10,
        borderWidth: 0,
        backgroundColor: 'rgba(15,23,42,0.88)',
        textStyle: { color: '#f1f5f9', fontSize: 12, whiteSpace: 'normal', width: 300 },
        confine: true
      }
    }
  };
  _selectedSummary: SummaryOverview;
  _selectedSummaryGrouped: {label: string, count: number, totalCount: number}[] = [];

  @Input() isLoading: boolean;
  @Input() set selectedSummary(value: SummaryOverview) {
      this._selectedSummary = value;
      this._selectedSummaryGrouped = this.groupByType(this._selectedSummary.data);
  };
  @Output() onNavigateSearch = new EventEmitter<{event: MouseEvent; row: {category: string, type: string, label: string} }>();

  private groupByType(value: {date: string, year: number, label: string, count: number, countTotal: number}[]): {label: string, count: number, totalCount: number}[] {
    if (!value.length) return [];

    const grouped = new Map<string, number>();
    let totalCount = 0;
    for (const {label, count} of value) {
      grouped.set(label, (grouped.get(label) ?? 0) + count);
      totalCount += count;
    }
    return Array.from(grouped, ([label, count]) => ({label, count, totalCount})).sort((a, b) => b.count - a.count);
  }
}