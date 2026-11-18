import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from "@angular/core";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html'
})
export class TimelineComponent implements OnChanges, OnInit, OnDestroy {
    private timeline: Timeline;
    private resizeObserver: ResizeObserver;

    @ViewChild('timeline', {static: true}) timelineElement: ElementRef;

    @Input() options: TimelineOptions;
    @Input() groups: DataGroup[];
    @Input() items: DataItem[];
    @Output() onTimelineCreated = new EventEmitter<Timeline>();
    @Output() onItemCLicked = new EventEmitter<any>();

    ngOnInit() {
        this.resizeObserver = new ResizeObserver(() => this.timeline?.redraw());
        this.resizeObserver.observe(this.timelineElement.nativeElement);
    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.items || changes.groups || changes.options) {
            if(this.items && this.groups && this.options) {
                this.destroy();
                this.create();
            }
        }
    }

    ngOnDestroy() {
        this.resizeObserver?.disconnect();
        this.destroy();
    }

    create() {
        this.timeline = new Timeline(this.timelineElement.nativeElement, this.items, this.groups, this.options);
        this.onTimelineCreated.emit(this.timeline);
        this.timeline.on('doubleClick', (prop) => {
            this.onItemCLicked.emit(prop)
        })
    }

    destroy() {
        if(this.timeline) this.timeline.destroy();
    }
}