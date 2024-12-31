import {Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from "@angular/core";
import {DataGroup, DataItem, Timeline} from "vis-timeline";
import {EnvRouter} from "../../../service/router.service";

@Component({
    selector: 'dump-timeline',
    template: '<div #timeline id="timeline"></div>'
})
export class DumpTimelineComponent implements OnChanges {
    private _router: EnvRouter = inject(EnvRouter);

    timeline: Timeline;

    @Input() items: DataItem[];
    @Input() groups: DataGroup[];

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.items || changes.groups){
            if(this.items && this.groups){
                if (this.timeline) this.timeline.destroy();
                this.timeline = new Timeline(this.timelineElement.nativeElement, this.items, this.groups, {
                    margin: {
                        item: {
                            horizontal: -1
                        }
                    },
                    verticalScroll: true,
                    zoomKey: 'ctrlKey',
                    maxHeight: 'calc(100vh - 56px - 48px - 48px - 1.5em)'
                });
                let that = this;
                this.timeline.on('doubleClick', function (props: any) {
                    if(props.item) {
                        let id = props.item.split('_')[0];
                        let type_session = props.item.split('_')[1];
                        let type_main = props.item.split('_')[2];
                        type_session == 'main' ? that._router.open(`#/session/${type_session}/${type_main}/${id}`, '_blank') : that._router.open(`#/session/${type_session}/${id}`, '_blank');
                    }
                });
            }
        }
    }
}