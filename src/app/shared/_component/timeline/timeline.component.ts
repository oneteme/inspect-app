import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild
} from "@angular/core";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html'
})
export class TimelineComponent implements OnChanges, OnDestroy {
    private timeline: Timeline;

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() options: TimelineOptions;
    @Input() groups: DataGroup[];
    @Input() items: DataItem[];
    @Output() onTimelineCreated = new EventEmitter<Timeline>();

    ngOnChanges(changes: SimpleChanges) {
        if(changes.items || changes.groups || changes.options) {
            if(this.items && this.groups && this.options) {
                this.destroy();
                this.create();
            }
        }
    }

    ngOnDestroy() {
        this.destroy();
    }

    create() {
        this.timeline = new Timeline(this.timelineElement.nativeElement, this.items, this.groups, this.options);
        this.onTimelineCreated.emit(this.timeline);
    }

    destroy() {
        if(this.timeline) this.timeline.destroy();
    }
}