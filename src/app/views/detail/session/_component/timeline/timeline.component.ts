import { DatePipe } from "@angular/common";
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, inject } from "@angular/core";
import { Timeline } from "vis-timeline";
import { DatabaseRequest, InstanceEnvironment, InstanceMainSession, InstanceRestSession, LocalRequest, RestRequest } from "src/app/model/trace.model";
import {EnvRouter} from "../../../../../service/router.service";

@Component({
    selector: 'request-timeline-table',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnChanges {
    private _router: EnvRouter = inject(EnvRouter);

    timeline: Timeline;
    pipe = new DatePipe('fr-FR');

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() instance:InstanceEnvironment;
    @Input() request:InstanceMainSession | InstanceRestSession;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.instance || changes.request){
            if(this.instance && this.request){
                let timeline_end = +this.request.end * 1000
                let timeline_start = +this.request.start * 1000
                let dataArray: any = [...<RestRequest[]>this.request.requests,
                ...<DatabaseRequest[]>this.request.queries,
                ...<LocalRequest[]>this.request.stages.map((s: any) => ({ ...s, isStage: true }))];
                dataArray.splice(0, 0, { ...this.request, isStage: true })
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
                data = dataArray.map((c: any, i: number) => {
                    let o = {
                        id: c.id ?? -1,
                        group: isWebapp ? 0 : c.threadName,
                        content: c.hasOwnProperty('isStage') ? '' : (c.schema || c.host || 'N/A'),
                        start: c.start * 1000,
                        end: c.end * 1000,
                        title: `<span>${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(c.end * 1000), 'HH:mm:ss.SSS')}</span><br>
                    <h4>${c[title]}:  ${this.getElapsedTime(c.end, c.start).toFixed(3)}s</h4>`,
                        className: c.hasOwnProperty('schema') ? "bdd" : !c.hasOwnProperty('isStage') ? "rest" : "",
                        type: c.hasOwnProperty('isStage') ? 'background' : 'range'
                    }
                    if (o.end > timeline_end) {
                        timeline_end = o.end
                    }
                    return o;
                })
    
                console.log(data, dataArray)
                if (this.timeline) {  // destroy if exists 
                    this.timeline.destroy();
                }
                // Create a Timeline
                this.timeline = new Timeline(this.timelineElement.nativeElement, data, groups, {
                    min: timeline_start,
                    max: timeline_end,
                    clickToUse: false,
                    selectable : false,
                    tooltip: {
                        followMouse: true
                    },
                    margin: {
                        item: {
                            horizontal: -1
                        }
                    },
                    order: (a, b) => {
                        return b.start - a.start // inverser l'ordre  
                    }
                });
    
                let that = this;
                this.timeline.on('click', function (props: any) {
                    let id = props.item;
                    console.log('test', props)
                    if (isNaN(id)) {
                        that._router.navigate(['session', 'rest', id]);
                    } else {
                        if(id != -1)
                            that._router.navigate(['session', 'rest', that.request.id, 'database', id]);
                    }
                });
    
                if (timeline_end != +this.request.end * 1000) {
                    this.timeline.addCustomTime(+this.request.end * 1000, "async");

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

    getElapsedTime(end: number, start: number,) {
        return end - start;
    }
}