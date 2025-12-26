import {DatePipe} from "@angular/common";
import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from "@angular/core";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {ANALYTIC_MAPPING} from "../../../../constants";
import {MainSessionView, RestSessionView} from "../../../../../model/request.model";
import {InstanceEnvironment} from "../../../../../model/trace.model";

let options: any = {
    clickToUse: true,
    selectable : false,
    cluster: {
        clusterCriteria : (firstItem: any, secondItem: any) => {
            if(firstItem.id.toString().includes("log_") && secondItem.id.toString().includes("log_")){
                return true;
            }
            return false;
        },
    },
    tooltip: {
        followMouse: true,
    },
    margin: {
        item: {
            horizontal: -1
        }
    },
    order: (a, b) => {
        return b.start - a.start // inverser l'ordre
    }
}

@Component({
    selector: 'detail-timeline',
    templateUrl: './detail-timeline.component.html',
    styleUrls: ['./detail-timeline.component.scss']
})
export class DetailTimelineComponent implements OnChanges {

    private readonly durationPipe = new DurationPipe();
    private readonly pipe = new DatePipe('fr-FR');
    protected readonly ANALYTIC_MAPPING = ANALYTIC_MAPPING;
    maptype : {
        [key: string]: (c:any,i:number)=> DataItem
    } = {
        'session-stage': (c:any,i:number) => this.mapSessionStage(c,i),
        'stage'        : (c:any,i:number) => this.mapother(c,i),
        'action'       : (c:any,i:number) => this.mapother(c,i),
        'rest'         : (c:any,i:number) => this.mapother(c,i),
        'ftp'          : (c:any,i:number) => this.mapother(c,i),
        'smtp'         : (c:any,i:number) => this.mapother(c,i),
        'ldap'         : (c:any,i:number) => this.mapother(c,i),
        'database'     : (c:any,i:number) => this.mapother(c,i),
        'local'        : (c:any,i:number) => this.mapother(c,i),
        'log'          : (c:any,i:number) => this.mapLog(c,i)
    }
    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    dataArray: any[] = [];
    isWebApp: boolean = false;
    timelineStart: number;
    timelineEnd: number;

    @Input() instance: InstanceEnvironment;
    @Input() request: MainSessionView | RestSessionView;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.instance || changes.request){
            if(this.instance && this.request){
                this.timelineStart = this.request.start * 1000; // -1ms to avoid the first item being out of the range
                this.timelineEnd = this.request.end ? this.request.end * 1000 : this.timelineStart + 3600000;
                let padding = (Math.ceil((this.timelineEnd - this.timelineStart) * 0.01))
                this.dataArray = [].concat(
                    (this.request.hasOwnProperty('userActions') ? (<MainSessionView>this.request).userActions ?? [] : []).map(r => ({...r, typeTimeline: 'action'})),
                    (this.request.restRequests ?? []).map(r => ({...r, typeTimeline: 'rest'})),
                    (this.request.ftpRequests ?? []).map(r => ({...r, typeTimeline: 'ftp'})),
                    (this.request.mailRequests ?? []).map(r => ({...r, typeTimeline: 'smtp'})),
                    (this.request.ldapRequests ?? []).map(r => ({...r, typeTimeline: 'ldap'})),
                    (this.request.databaseRequests ?? []).map(r => ({...r, typeTimeline: 'database'})),
                    (this.request.localRequests ?? []).map(r => ({...r, typeTimeline: 'local'})),
                    (this.request.logEntries ?? []).map(r => ({...r, typeTimeline: 'log'})),
                    (this.request.httpSessionStages ?? []).map(r => ({...r, typeTimeline: 'session-stage'})));
                this.sortInnerArrayByDate(this.dataArray);
                if (this.request['type'] != null && this.request['type'] === "VIEW") {
                    this.dataGroups = [{ id: 0, content: this.instance.re }];
                    this.isWebApp = true;
                } else {
                    this.dataGroups = [...new Set(this.dataArray.filter(c => c.threadName).map(c => c.threadName))].map((c: any) => ({ id: c, content: c }))
                }
                if(this.dataArray.length > 50 ){
                    this.timelineEnd = this.dataArray[51].start * 1000;
                    this.dataItems = this.getDataForRange(this.dataArray, this.timelineStart / 1000, this.timelineEnd / 1000).map((c: any, i: number) =>this.maptype[c.typeTimeline](c, i));
                } else {
                    this.dataItems = this.dataArray.map((c: any, i: number) =>this.maptype[c.typeTimeline](c, i));
                }

                this.options = {
                    ...options,
                    start: this.timelineStart - padding,
                    end: this.timelineEnd + padding
                };
            }
        }
    }

    sortInnerArrayByDate(innerArray: any[]): any[] {
        return innerArray.sort((a, b) => {
            if (a.start > b.start)
                return 1;

            if (a.start < b.start)
                return -1;

            if (a.threadName && b.threadName)
                return a.threadName.localeCompare(b.threadName)

        });
    }

    getErrorClassName(o: any): string{
        if(o.typeTimeline === "rest"){
            if(o.status >=400 && o.status <500)
                return  "client-error"
            if(o.end && (o.status >=500 || o.status ==0))
                return "error"
        } else {
            if(o.exception) {
                return "error";
            }
        }
        return '';
    }

    getDataForRange(arr: any[], start: number, end: number){
        return arr.filter(c=>(c.start>=start && c.end <=end)
            || (c.start <start && c.end >= start  && c.end <=end)
            || (c.start>= start && c.start <= end && c.end > end)
            || (c.start< start && c.end > end)
            || (c.instant>= start && c.instant <= end))
    }

    mapother(c:any, id:number) : DataItem{
        const isInProgress = !c.end && c.typeTimeline != 'action';
        let end = c.typeTimeline == 'action' ? c.start * 1000 :
            c.end ? c.end * 1000 :  new Date(new Date().setHours(23, 59, 59, 999)).getTime();
        let o = {
            id: id,
            group: this.isWebApp ? 0 : c.threadName,
            content: c.typeTimeline == 'stage' ? '' : c.typeTimeline == 'action' ? this.ANALYTIC_MAPPING[c.type].label : (c.schema || c.name || c.host || c.level || 'N/A'),
            start: c.start * 1000,
            end: end,
            title: c.typeTimeline == 'action' ?
                `${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')}</span><br>
                     <h4>${this.ANALYTIC_MAPPING[c['type']].text(c)}</h4>` :
                c.typeTimeline == 'log' ?
                    `${this.pipe.transform(new Date(c.instant * 1000), 'HH:mm:ss.SSS')}</span><br>
                      <h4>${c['message'] || ''}</h4>` :
                    `${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${c.end ? this.pipe.transform(new Date(end), 'HH:mm:ss.SSS'):"En cours..."}</span> ${c.end ? `(${this.durationPipe.transform({start: c.start, end: end / 1000})})`:""}<br>
                     <h4>${c['path'] || ''}</h4>`,
            className: c.typeTimeline != 'stage' ? c.typeTimeline : "",
            type: ''
        }
        o.type = c.typeTimeline == 'stage' ? 'background' : o.end == o.start ? 'point' : 'range';
        if (isInProgress) {
            o.className += ' in-progress';
        }
        if (o.end > this.timelineEnd) {
            this.timelineEnd = o.end;
        }
        if(o.type == 'range'){
            o.className += ` ${this.getErrorClassName(c)}`;
        }
        id++;
        return o;
    }

    mapLog(le: any, id: number): DataItem {
        const el = document.createElement('span');
        el.innerHTML = `<span class="material-icons ${le.level.toLowerCase()}" >${le.level.toLowerCase()}</span>`
        return {
            id: `log_${id}`,
            group:  this.isWebApp ? 0 : this.dataArray[0].threadName,
            content: el as unknown as any,
            start: le.instant * 1000,
            title: `${this.pipe.transform(new Date(le.instant * 1000), 'HH:mm:ss.SSS')}</span><br><h4>${le.message || ''}</h4>`,
            className: `log-${le.level.toLowerCase()}`,
        }
    }

    mapSessionStage(le: any, id: number): DataItem {
        return {
          id: 'stage_' + id,
          content: "",
          start: le.start * 1000,
          end: le.end * 1000,
          className: `stage-${le.name.toLowerCase() ==="process"? "process":"other-process"}`,//
          type: "background"
      }
    }


    onTimelineCreate(timeline: Timeline) {
        if(this.dataItems.length > 50 ) {
            timeline.on('rangechanged', (props)=>{
                timeline.setItems(this.getDataForRange(this.dataArray, props.start.getTime() / 1000, props.end.getTime() / 1000).map((c: any, i: number) =>this.maptype[c.typeTimeline](c, i)));
            });
        }

        if (this.timelineEnd != this.request.end * 1000) {
            timeline.addCustomTime(this.request.end * 1000, "async");
        }
    }
}