import {DatePipe} from "@angular/common";
import {Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild} from "@angular/core";
import {Timeline} from "vis-timeline";
import {
    DatabaseRequest, FtpRequest,
    InstanceEnvironment,
    InstanceMainSession,
    InstanceRestSession,
    LocalRequest, MailRequest, NamingRequest,
    RestRequest
} from "src/app/model/trace.model";
import {EnvRouter} from "../../../../../service/router.service";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'timeline-table',
    templateUrl: './detail-timeline.component.html',
    styleUrls: ['./detail-timeline.component.scss']
})
export class DetailTimelineComponent implements OnChanges {
    private _router: EnvRouter = inject(EnvRouter);
    private _activatedRoute = inject(ActivatedRoute);

    timeline: Timeline;
    pipe = new DatePipe('fr-FR');
    private durationPipe = new DurationPipe();

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() instance: InstanceEnvironment;
    @Input() request: InstanceMainSession | InstanceRestSession;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.instance || changes.request){
            if(this.instance && this.request){
                let timeline_end = this.request.end * 1000
                let timeline_start = this.request.start * 1000
                let dataArray: any = [...<RestRequest[]>this.request.restRequests.map(r => ({...r, type: 'rest'})),
                    ...<FtpRequest[]>this.request.ftpRequests.map(r => ({...r, type: 'ftp'})),
                    ...<MailRequest[]>this.request.mailRequests.map(r => ({...r, type: 'smtp'})),
                    ...<NamingRequest[]>this.request.ldapRequests.map(r => ({...r, type: 'ldap'})),
                    ...<DatabaseRequest[]>this.request.databaseRequests.map(r => ({...r, type: 'database'})),
                    ...<LocalRequest[]>this.request.stages.map(r => ({...r, type: 'stage'}))];
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
                data = dataArray.map((c: any, i: number) => {
                    let o = {
                        id: c.id ? `${c.id}_${c.type}` : `${c.idRequest}_no_session`,
                        group: isWebapp ? 0 : c.threadName,
                        content: c.type == 'stage' ? '' : (c.name || c.host || 'N/A'),
                        start: c.start * 1000,
                        end: c.end * 1000,
                        title: `<span>${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(c.end * 1000), 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform({start: c.start, end: c.end})})<br>
                    <h4>${c[title]}</h4>`,
                        className: c.type == 'database' ? "bdd" : c.type != 'stage' ? "rest" : "",
                        type: c.type == 'stage' ? 'background' : 'range'
                    }
                    if (o.end > timeline_end) {
                        timeline_end = o.end
                    }
                    return o;
                })
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
                /*this.timeline.on('doubleClick', function (props: any) {
                    let id = props.item.split('_')[0];
                    let type = props.item.split('_')[1];
                    console.log(id, type, that.request.id, that._activatedRoute.snapshot.data.type)
                    if (type == 'rest') {
                        that._router.navigate(['session', 'rest', id]);
                    } else {
                        that._router.navigate(['session', that._activatedRoute.snapshot.data.type, that.request.id, type, id]);
                    }
                });*/
    
                if (timeline_end != this.request.end * 1000) {
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
}