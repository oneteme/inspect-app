import {Component, Input} from "@angular/core";

@Component({
    selector: 'label-chip',
    template: `
        <div class="label-chip"  [ngClass]="color">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        .label-chip {
            width: max-content;
            border-radius: 16px;
            padding: 0.2em 1em;
            font-size: 12px;
        }
        .label-chip.blue {
            background-color: rgba(20,100,220,0.2);
            color: rgba(20,100,220);
        }
        .label-chip.orange {
            background-color: rgba(226,121,0,0.2);
            color: rgba(226,121,0);
        }
        .label-chip.red {
            background-color: rgba(205,6,6,0.2);
            color: rgba(205,6,6);
        }
    `]
})
export class LabelChipComponent {
    @Input() color: string = 'blue';
}