import {Component, Input} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";

@Component({
  selector: 'dependency-chart',
  templateUrl: './dependency-chart.component.html',
  styleUrls: ['./dependency-chart.component.scss']
})
export class DependencyChartComponent {
  chartProvider: ChartProvider<string, number> = {
    height: 400,
    series: [
      {
        data: { x: field('target'), y: field('count') },
        name: field('origin')
      }
    ],
    options: {
      series: [{
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 700,
          color: '#1e293b',
          textBorderColor: '#ffffff',
          textBorderWidth: 2,
          formatter: (params: any) =>
            params.value[2] > 0 ? params.value[2].toLocaleString('fr-FR') : ''
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.25)'
          }
        },
        itemStyle: {
          borderRadius: 4,
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      }],
      backgroundColor: 'transparent',
      grid: {
        top: 12,
        bottom: 72,
        left: 12,
        right: 12,
        containLabel: true
      },
      xAxis: {
        axisLabel: {
          rotate: 35,
          overflow: 'truncate',
          width: 110,
          fontSize: 11,
          fontWeight: 500,
          color: '#475569',
          interval: 0
        },
        axisTick: { show: false },
        axisLine: { show: false },
        splitArea: {
          show: true,
          areaStyle: { color: ['#f8fafc', '#ffffff'] }
        }
      },
      yAxis: {
        minInterval: 1,
        axisLabel: {
          overflow: 'truncate',
          width: 130,
          fontSize: 11,
          fontWeight: 500,
          color: '#475569',
          interval: 0
        },
        axisTick: { show: false },
        axisLine: { show: false },
        splitArea: {
          show: true,
          areaStyle: { color: ['#f8fafc', '#ffffff'] }
        }
      },
      visualMap: {
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemHeight: 140,
        itemWidth: 14,
        text: ['Élevé', 'Faible'],
        textStyle: { fontSize: 10, color: '#94a3b8', fontWeight: 600 },
        inRange: {
          color: ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a']
        }
      },
      tooltip: {
        position: 'top',
        borderRadius: 10,
        borderWidth: 0,
        backgroundColor: 'rgba(15,23,42,0.85)',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: (params: any) => {
          return `<div style="line-height:1.6">` +
            `<span style="color:#94a3b8;font-size:11px">Cible</span><br/>` +
            `<b style="color:#f8fafc">${params.name}</b><br/>` +
            `<span style="color:#60a5fa;font-weight:700;font-size:13px">${ params.value[2].toLocaleString('fr-FR')} appels</span>` +
            `</div>`;
        }
      }
    }
  }
  _data: any = [];

  @Input() queryParams: QueryParams;

  @Input() set data(value: any[]) {
    if(value) {
      this._data = value
    }
  }

  @Input() loading: boolean;
}
