import {Component, Input} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";

@Component({
  selector: 'user-chart',
  templateUrl: './user-chart.component.html',
  styleUrls: ['./user-chart.component.scss']
})
export class UserChartComponent {
  chartProvider: ChartProvider<string, number> = {
    series: [
      { data: { x: field('date'), y: field('count') }, name: 'Utilisateurs' }
    ],
    options: {
      backgroundColor: 'transparent',
      color: ['#8b5cf6'],
      grid: {
        top: 16,
        bottom: 40,
        left: 8,
        right: 16,
        containLabel: true
      },
      xAxis: {
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      yAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: '#f1f5f9', type: 'dashed' }
        },
        axisLabel: {
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      series: [{
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false, // n'affiche les points qu'au survol
        lineStyle: {
          width: 2.5,
          color: '#8b5cf6'
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#8b5cf6',
          borderWidth: 2.5
        },
        emphasis: {
          showSymbol: true,
          itemStyle: {
            color: '#8b5cf6',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: 'rgba(139,92,246,0.4)'
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,   color: 'rgba(139,92,246,0.25)' },
              { offset: 0.6, color: 'rgba(139,92,246,0.06)' },
              { offset: 1,   color: 'rgba(139,92,246,0.00)' }
            ]
          }
        }
      }]
    }
  };

  _data: any = [];

  @Input() queryParams: QueryParams;

  @Input() set data(value: any[]) {
    if(value) {
      this._data = value;
    }
  }

  @Input() loading: boolean;
}
