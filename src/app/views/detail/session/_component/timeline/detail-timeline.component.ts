import {DatePipe} from "@angular/common";
import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from "@angular/core";
import {Timeline} from "vis-timeline";
import {
    DatabaseRequest, FtpRequest,
    InstanceEnvironment,
    InstanceMainSession,
    InstanceRestSession,
    LocalRequest, MailRequest, NamingRequest,
    RestRequest
} from "src/app/model/trace.model";

import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import { DataSet } from "vis-data";

const INFINIT = new Date(9999,12,31).getTime();

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
    selector: 'timeline-table',
    templateUrl: './detail-timeline.component.html',
    styleUrls: ['./detail-timeline.component.scss']
})
export class DetailTimelineComponent implements OnChanges {

    private readonly durationPipe = new DurationPipe();
    timeline: Timeline;
    timeline_end;
    timeline_start;
    timeline_end_limited;
    withFilter:boolean
    pipe = new DatePipe('fr-FR');
  

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() instance: InstanceEnvironment;
    @Input() request: InstanceMainSession | InstanceRestSession;

    ngOnChanges(changes: SimpleChanges): void { //set data TimelineEntry[] ddata
        if(changes.instance || changes.request){
            if(this.instance && this.request){
                this.timeline_start = this.request.start
                let dataArray: any = [...<RestRequest[]>this.request.restRequests.map(r => ({...r, type: 'rest'})),
                    ...<FtpRequest[]>this.request.ftpRequests.map(r => ({...r, type: 'ftp'})),
                    ...<MailRequest[]>this.request.mailRequests.map(r => ({...r, type: 'smtp'})),
                    ...<NamingRequest[]>this.request.ldapRequests.map(r => ({...r, type: 'ldap'})),
                    ...<DatabaseRequest[]>this.request.databaseRequests.map(r => ({...r, type: 'database'})),
                    ...<LocalRequest[]>this.request.stages.map(r => ({...r, type: 'local'}))];
                dataArray.splice(0, 0, { ...this.request, type: 'stage' });
                this.sortInnerArrayByDate(dataArray);
                let data: any;
                let groups: any;
                let isWebapp = false, title = '';
                if (this.request.type != null && this.request.type === "VIEW") {
                    groups = [{ id: 0, content: this.instance.re }];
                    title = 'path';
                    isWebapp = true;
                } else {
                    groups = new Set();
                    dataArray.forEach((c: any, i: number) => {
                        groups.add(c['threadName'])
                    });
                    title = 'threadName';
                    groups = Array.from(groups).map((g: string) => ({ id: g, content: g }))
                }

                if (this.timeline) {  // destroy if exists 
                    this.timeline.destroy();
                }
                this.timeline = new Timeline(this.timelineElement.nativeElement, [], [], options);
                if(dataArray.length >50 ){
                    this.timeline_end = dataArray[51].start;
                    this.timeline_end_limited = dataArray[51].start *1000
                    data = new DataSet(this.dataSetup(this.getDataforRange(dataArray,this.timeline_start, this.timeline_end),isWebapp,title));
                    this.timeline.on('rangechanged', (props)=>{
                            this.timeline.setItems(new DataSet(this.dataSetup(this.getDataforRange(dataArray,props.start.getTime()/1000, props.end.getTime()/1000),isWebapp,title)));
                    })
                }else {
                    this.timeline_end = this.request.end
                    data = new DataSet(this.dataSetup(dataArray,isWebapp,title));
                }
                        
                this.timeline.setOptions({
                    start: this.timeline_start *1000,
                    end: this.timeline_end_limited ? this.timeline_end_limited : (this.timeline_end)
                });

                this.timeline.setData({
                    groups: groups,
                    items: data
                })

                if (this.timeline_end != this.request.end * 1000) {
                    this.timeline.addCustomTime(this.request.end * 1000, "async");
                }              
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

    getErrorClassName(o:any): string{
        if(o.type === "rest"){
            if(o.status >=400 && o.status <500)
                return  "client-error"
            if(o.status >=500 || o.status ==0)
                return "error"
        }else if(!o.status){
            return "error"
        }
        return '';
    }

    getDataforRange(arr:any[],start:number, end:number){
        return arr.filter(c=>(c.start>=start && c.end <=end)
         || (c.start <start && c.end >= start  && c.end <=end) 
         || (c.start>= start && c.start <= end &&c.end > end )
         || (c.start< start && c.end > end))
    }

    dataSetup(dataArray:any[], isWebapp: boolean,title: string,){
        let c =  dataArray.map((c: any, i: number) => {
            let end = c.end? c.end * 1000 :INFINIT; 
            let o = {
                id: c.id ? `${c.id}_${c.type}` : `${c.idRequest}_no_session`,
                group: isWebapp ? 0 : c.threadName,
                content: c.type == 'stage' ? '' : (c.schema || c.name || c.host || 'N/A'),
                start: c.start * 1000,
                end: end,
                title: `
                        ${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${c.end? this.pipe.transform(new Date(end), 'HH:mm:ss.SSS'):"?"}</span> ${c.end ? `(${this.durationPipe.transform({start: c.start, end: end/ 1000})})`:""}<br>
                         <h4>${c[title]}</h4>`,
                className: c.type != 'stage' ? c.type : "",
                type: c.type == 'stage' ? 'background' : 'range'
            }
            if (o.end > this.timeline_end && o.end != INFINIT) {
                this.timeline_end = o.end
            }
            if(o.type != 'background'){
                o.className += ` ${this.getErrorClassName(c)}`;
            }
        
            return o;
        })
        return c;
    }
}