import {DatePipe} from "@angular/common";
import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from "@angular/core";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
import {InstanceEnvironment, InstanceMainSession, InstanceRestSession} from "src/app/model/trace.model";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {ANALYTIC_MAPPING, INFINITY} from "../../../../constants";

let options: any = {
    clickToUse: true,
    selectable : false,
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

    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    dataArray: any[] = [];
    isWebApp: boolean = false;
    timelineStart: number;
    timelineEnd: number;

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() instance: InstanceEnvironment;
    @Input() request: InstanceMainSession | InstanceRestSession;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.instance || changes.request){
            if(this.instance && this.request){
                this.timelineStart = this.request.start * 1000;
                this.timelineEnd = this.request.end * 1000;
                this.dataArray = [].concat(
                    (this.request.hasOwnProperty('userActions') ? (<InstanceMainSession>this.request).userActions ?? [] : []).map(r => ({...r, typeTimeline: 'action'})),
                    (this.request.restRequests ?? []).map(r => ({...r, typeTimeline: 'rest'})),
                    (this.request.ftpRequests ?? []).map(r => ({...r, typeTimeline: 'ftp'})),
                    (this.request.mailRequests ?? []).map(r => ({...r, typeTimeline: 'smtp'})),
                    (this.request.ldapRequests ?? []).map(r => ({...r, typeTimeline: 'ldap'})),
                    (this.request.databaseRequests ?? []).map(r => ({...r, typeTimeline: 'database'})),
                    (this.request.stages ?? []).map(r => ({...r, typeTimeline: 'local'})))
                console.log(this.dataArray);
                this.dataArray.splice(0, 0, { ...this.request, typeTimeline: 'stage' });
                this.sortInnerArrayByDate(this.dataArray);
                if (this.request.type != null && this.request.type === "VIEW") {
                    this.dataGroups = [{ id: 0, content: this.instance.re }];
                    this.isWebApp = true;
                } else {
                    this.dataGroups = [...new Set(this.dataArray.map(c => c.threadName))].map((c: any) => ({ id: c, content: c }))
                }
                if(this.dataArray.length > 50 ){
                    this.timelineEnd = this.dataArray[51].start * 1000;
                    this.dataItems = this.dataSetup(this.getDataForRange(this.dataArray, this.timelineStart / 1000, this.timelineEnd / 1000), this.isWebApp);
                } else {
                    this.dataItems = this.dataSetup(this.dataArray, this.isWebApp);
                }

                this.options = {
                    ...options,
                    start: this.timelineStart,
                    end: this.timelineEnd
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
        if(o.type === "rest"){
            if(o.status >=400 && o.status <500)
                return  "client-error"
            if(o.status >=500 || o.status ==0)
                return "error"
        }
        return '';
    }

    getDataForRange(arr: any[], start: number, end: number){
        return arr.filter(c=>(c.start>=start && c.end <=end)
            || (c.start <start && c.end >= start  && c.end <=end)
            || (c.start>= start && c.start <= end &&c.end > end )
            || (c.start< start && c.end > end))
    }

    dataSetup(dataArray:any[], isWebapp: boolean): DataItem[] {
        let id = 0;
        return  dataArray.map((c: any, i: number) => {
            let end = c.typeTimeline == 'action' ? c.start * 1000 :
                c.end ? c.end * 1000 : INFINITY;
            let o = {
                id: id,
                group: isWebapp ? 0 : c.threadName,
                content: c.typeTimeline == 'stage' ? '' : (c.schema || c.name || c.host || 'N/A'),
                start: c.start * 1000,
                end: end,
                title: c.typeTimeline == 'action' ?
                    `${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')}</span><br>
                     <h4>${this.ANALYTIC_MAPPING[c['type']].text(c)}</h4>` :
                    `${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${c.end ? this.pipe.transform(new Date(end), 'HH:mm:ss.SSS'):"?"}</span> ${c.end ? `(${this.durationPipe.transform({start: c.start, end: end / 1000})})`:""}<br>
                     <h4>${c['path'] || ''}</h4>`,
                className: c.typeTimeline != 'stage' ? c.typeTimeline : "",
                type: ''
            }
            o.type = c.typeTimeline == 'stage' ? 'background' : o.end == o.start ? 'point' : 'range';
            if (o.end > this.timelineEnd && o.end != INFINITY) {
                this.timelineEnd = o.end;
            }
            if(o.type != 'background'){
                o.className += ` ${this.getErrorClassName(c)}`;
            }
            id++;
            return o;
        });
    }

    onTimelineCreate(timeline: Timeline) {
        if(this.dataItems.length > 50 ) {
            timeline.on('rangechanged', (props)=>{
                timeline.setItems(this.dataSetup(this.getDataForRange(this.dataArray, props.start.getTime() / 1000, props.end.getTime() / 1000), this.isWebApp));
            });
        }

        if (this.timelineEnd != this.request.end * 1000) {
            timeline.addCustomTime(this.request.end * 1000, "async");
        }
    }
}