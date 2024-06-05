import { DatePipe } from "@angular/common";
import { Component, ElementRef, Input, OnInit, ViewChild, inject } from "@angular/core";
import { OutcomingQuery, OutcomingRequest, Request, RunnableStage } from "src/app/shared/model/trace.model";
import { Timeline } from "vis-timeline";
import { EnvRouter } from "../../session-detail.component";

@Component({
    selector: 'request-timeline-table',
    templateUrl: './request-timeline.component.html',
    styleUrls: ['./request-timeline.component.scss']
})
export class RequestTimelineComponent {
    private _router: EnvRouter = inject(EnvRouter);

    timeline: any;
    pipe = new DatePipe('fr-FR');

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() set request(request: any) {
        if (request) {
            let timeline_end = +request.end * 1000
            let timeline_start = +request.start * 1000
            let dataArray: any = [...<OutcomingRequest[]>request.requests,
            ...<OutcomingQuery[]>request.queries,
            ...<RunnableStage[]>request.stages.map((s: any) => ({ ...s, isStage: true }))];
            dataArray.splice(0, 0, { ...request, isStage: true })
            this.sortInnerArrayByDate(dataArray);


            let data: any;
            let groups: any;
            let isWebapp = false, title = '';
            if (request.launchMode != null && request.launchMode === "WEBAPP") {
                groups = [{ id: 0, content: request?.application?.re }];
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
                    id: c.hasOwnProperty('schema') ? -i : c.id,
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


            if (this.timeline) {  // destroy if exists 
                this.timeline.destroy();
            }
            // Create a Timeline
            this.timeline = new Timeline(this.timelineElement.nativeElement, data, groups, {
                min: timeline_start,
                max: timeline_end,
                clickToUse: true,
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
            this.timeline.on('select', function (props: any) {
                let id = props.items[0];
                if (isNaN(+id)) {
                    that._router.navigate(['/session', 'api', id]);
                }
            });

            if (timeline_end != +request.end * 1000) {
                this.timeline.addCustomTime(+request.end * 1000, "async");
                this.timeline.setCustomTimeMarker("async", "async");
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