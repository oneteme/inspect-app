import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpRequestStage, HttpSessionStage, RestSession} from "../../../../../model/trace.model";
import {INFINITY} from "../../../../constants";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../../../../shared/pipe/duration.pipe";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";

@Component({
  templateUrl: './stage-dialog.component.html'
})
export class StageDialogComponent {
  private readonly pipe = new DatePipe('fr-FR');
  private readonly durationPipe = new DurationPipe();

  options: TimelineOptions;
  dataItems: DataItem[];
  dataGroups: DataGroup[];

  constructor(public dialogRef: MatDialogRef<StageDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {session: RestSession, stages: HttpSessionStage[]}) {

    this.createTimeline(data.session, data.stages);
  }

  createTimeline(session: RestSession, stages: HttpSessionStage[]) {
    let timelineStart = Math.trunc(session.start * 1000);
    let timelineEnd = session.end ? Math.trunc(session.end * 1000) : timelineStart + 3600000;
    let items = stages.map((a: HttpSessionStage, i: number) => {
      let start= Math.trunc(a.start * 1000);
      let end = a.end? Math.trunc(a.end * 1000) : INFINITY;
      return {
        group: `${i}`,
        start: start,
        end: end,
        type: end <= start ? 'point' : 'range',
        content: '',
        className: `rest`,
        title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>`
      };
    });
    items.splice(0,0,{
      title: '',
      group: 'parent',
      start: timelineStart,
      end: timelineEnd,
      content: (session.host || 'N/A'),
      className: 'overflow',
      type: 'background'
    });
    let groups: any[] = stages.map((a:HttpRequestStage, i:number) => ({ id: i, content: a?.name, treeLevel: 2}));
    groups.splice(0, 0, {id: 'parent', content: session.threadName, treeLevel: 1, nestedGroups:groups.map(g=>(g.id))});
    let padding = (Math.ceil((timelineEnd - timelineStart) * 0.01));
    this.dataItems = items;
    this.dataGroups = groups;
    this.options = {
      start: timelineStart - padding,
      end: timelineEnd + padding,
      selectable : false,
      clickToUse: true,
      tooltip: {
        followMouse: true
      }
    };
  }
}