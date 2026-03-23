import {Component, EventEmitter, inject, Input, Output, OnInit} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";

export interface RepartitionTypeCardConfig {
  title: string;
  indicators: { label: string, value: string }[];
  groups: { label: string, value: string, group?: (row: any) => string, properties?: string[]}[];
  slices: { label: string, value: string }[];
  series: { label: string, value: string, properties?: { selector: string; name: string }[] }[];
  chartProvider?: ChartProvider<string, number>;
}

export interface DynamicChartEvent {
  type: 'group' | 'indicator' | 'slice' | 'series' | 'sliceClick';
  config: {
    selectedIndicator: string;
    selectedGroup: string;
    selectedSlice: string;
    selectedSerie: string;
  };
  sliceFilter?: any;
}

@Component({
  selector: 'dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss']
})
export class DynamicChartComponent implements OnInit {

  config = {
    selectedIndicator: '',
    selectedGroup: '',
    selectedSlice: '',
    selectedSerie: ''
  };
  cardConfig: RepartitionTypeCardConfig = {
    title:"",
    indicators: [],
    groups: [],
    slices: [],
    series: [],
  };

  _data: any[] = [];
  sliceFilter: any = {};

  @Output() chartEmitter: EventEmitter<any> = new EventEmitter<any>();
  @Input() set menuConfig(configuration: RepartitionTypeCardConfig) {
    this.cardConfig = configuration;
  }
  @Input() set data(objects: any[]) {
    this._data = [];
    if (objects?.length > 0 ) {
      this._data = this.generateDynamicSeries(objects);
    }
  }
  @Input() sliceData: any[] = [];
  @Input() isLoading: boolean;


  ngOnInit(): void {
    setTimeout(() => this.triggerInitialChartLoad(), 0);
  }

  private triggerInitialChartLoad(): void {
    // Set default values from configuration
    if (this.cardConfig?.indicators?.length > 0) {
      this.config.selectedIndicator = this.cardConfig.indicators[0].value;
    }
    if (this.cardConfig?.groups?.length > 0) {
      this.config.selectedGroup = this.cardConfig.groups[0].value;
    }
    if (this.cardConfig?.series?.length > 0) {
      this.config.selectedSerie = this.cardConfig.series[0].value;
    }

    this.chartEmitter.emit({
      type: 'group',
      config: this.config,
      sliceFilter: this.sliceFilter
    });
  }

  //limit group element to 50
  onSelectGroup(group: { label:string, value:string }): void {
    this.config.selectedGroup = group.value;
    this.chartEmitter.emit({
      type: 'group',
      config: this.config,
      sliceFilter: this.sliceFilter
    });
  }

  onSelectIndicator(indicator: { label:string, value:string }): void {
    this.config.selectedIndicator = indicator.value;
    this.chartEmitter.emit({
      type: 'indicator',
      config: this.config,
      sliceFilter: this.sliceFilter
    });
  }


  onSelectSlice(slice: { label:string, value:string }): void {
    if (this.config.selectedSlice === slice.value) {
      this.config.selectedSlice = '';
    } else {
      this.config.selectedSlice = slice.value;
    }
    if (this.config.selectedSlice) {
      this.chartEmitter.emit({
        type:"slice",
        config: this.config,
      });
    }else {
      this.sliceRowClick(null);
    }
  }

  onSelectSeries(serie: { label:string, value:string }): void {
    if(this.config.selectedSerie === serie.value){
      this.config.selectedSerie = '';
    }else {
      this.config.selectedSerie = serie.value;
    }
    this.chartEmitter.emit({
      type: 'series',
      config: this.config,
      sliceFilter: this.sliceFilter
    });
  }


  sliceRowClick(event: any){
    if (event) {
      this.sliceFilter = event;
    } else {
      this.sliceFilter = {};
    }
    this.chartEmitter.emit({
      type: 'sliceClick',
      config: this.config,
      sliceFilter: this.sliceFilter
    });
  }


  //------------------------------------
  // Color palette for dynamic series
  private readonly colorPalette: string[] = [
    '#2f8dd0', '#f7941d', '#33cc33', '#ff0000', '#9c27b0',
    '#00bcd4', '#e91e63', '#ffeb3b', '#795548', '#607d8b',
    '#4caf50', '#ff5722', '#673ab7', '#3f51b5', '#009688'
  ];

  private generateDynamicSeries(data: any[]) {
    const fieldName = this.config.selectedSerie
    if(!fieldName){
        this.chartProvider.series = [{data: {x:field(this.config.selectedGroup), y: field('count')}, name: 'default', color: this.colorPalette[0]}];// todo make this dynamic
        return data;
    }else {
      let serie = this.cardConfig.series.filter(s => s.value === fieldName)[0];
      if(serie.properties){
        this.chartProvider.series = serie.properties.map((c, index) => ({
          data: {x: field(this.config.selectedGroup), y: field(c.selector)},
          name: c.name || c.selector,
          color: this.colorPalette[index % this.colorPalette.length]
        }));
        return data;
      }

      let dynamicSeriesMap: Map<string, any> = new Map();
      const uniqueValues = new Set<string>();
      data.forEach(item => {
        if (item[fieldName]) {
          uniqueValues.add(String(item[fieldName]));
        }
      });

      dynamicSeriesMap.clear();
      let colorIndex = 0;
      Array.from(uniqueValues).sort((a, b) => a.localeCompare(b)).forEach(value => {
       dynamicSeriesMap.set(value, {
          selector: value,
          name: value,
          color: this.colorPalette[colorIndex % this.colorPalette.length]
        });
        colorIndex++;
      });

      if (this.config.selectedSerie === fieldName) {
        this.chartProvider.series = Array.from(dynamicSeriesMap.values()).map(s => ({
          data: {x: field(this.config.selectedGroup), y: field(s.selector)},
          name: s.name,
          color: s.color
        }));
       return this.processDataByValue(data, fieldName);
      }
    }
  }


  private processDataByValue(data: any[], fieldName: string): any[] {
    // First pass: collect all unique status codes
    const uniqueValues = new Set<string>();
    data.forEach(item => {
      const statusCode = String(item[fieldName]);
       if(statusCode!= 'undefined'){
         uniqueValues.add(statusCode);
       }
    });

    // Group data by group key and consolidate status codes and counts
    const groupedData: Map<string, any> = new Map();
    data.forEach(item => {
      const groupKey = this.cardConfig.groups.filter(g=> g.value === this.config.selectedGroup)[0].group(item);
      const statusCode = String(item[fieldName]);
      const countValue = item['count'];

      if (!groupedData.has(groupKey)) {
        // Initialize the group with selected group properties and all status codes set to 0
        const newGroup: any = {};

        // Add properties based on selected group
        this.cardConfig.groups.filter(g=> g.value === this.config.selectedGroup)[0].properties.forEach(prop => {
          newGroup[prop] = item[prop];
        });

        // Initialize all status codes with 0
        uniqueValues.forEach(code => {
          newGroup[code] = 0;
        });

        groupedData.set(groupKey, newGroup);
      }

      // Add the status code and its count to the group
      const groupObj = groupedData.get(groupKey)!;
      groupObj[statusCode] = countValue;
    });

    return Array.from(groupedData.values());
  }

  get chartProvider(): ChartProvider<string, number> {
    return this.cardConfig.chartProvider;
  }

  set chartProvider(value: ChartProvider<string, number>) {
    if (this.cardConfig) {
      this.cardConfig.chartProvider = value;
    }
  }

  get configList() {
    return {
      indicators: this.cardConfig.indicators,
      groups: this.cardConfig.groups,
      slices: this.cardConfig.slices,
      series: this.cardConfig.series
    };
  }
}

