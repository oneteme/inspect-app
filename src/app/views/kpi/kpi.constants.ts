import {ChartProvider, field} from "@oneteme/jquery-core";

export const STATUS_CHART_PROVIDER_BASE: Partial<ChartProvider<string, number>> = {
  stacked: true,
  series: [],
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
      axisLabel: { fontSize: 11, color: '#94a3b8', formatter: (v: number) => v?.toLocaleString('fr-FR') }
    },
    tooltip: {
      trigger: 'axis',
      borderRadius: 10,
      borderWidth: 0,
      backgroundColor: 'rgba(15,23,42,0.88)',
      textStyle: { color: '#f1f5f9', fontSize: 12, whiteSpace: 'normal', width: 300 },
      confine: true
    }
  }
};

export class PieConfigFactory {
  static create(fieldX: string, fieldY: string): ChartProvider<string, number> {
    return {
      series: [{ data: { x: field(fieldX), y: field(fieldY) } }],
      options: {
        legend: { orient: 'horizontal', bottom: 0, left: 'center' },
        tooltip: {
          formatter: (params: any) =>
            `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
        }
      }
    };
  }
}
