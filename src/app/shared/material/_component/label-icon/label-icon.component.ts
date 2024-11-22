import {Component, Input} from "@angular/core";

@Component({
    selector: 'label-icon',
    template: `
    <div style="display: flex; align-items: center;">
        <mat-icon
            [ngClass]="{ 'material-symbols-outlined': iconOutlined }"
            style="margin-right: 0.5em;"
            [ngStyle]="{ color : color, 'width.px': size, 'height.px': size, 'font-size.px': size}"
        >{{ icon }}</mat-icon>
        <ng-content></ng-content>
    </div>
    `,
})
export class LabelIconComponent {
    @Input() public icon: string;
    @Input() public iconOutlined = true;
    @Input() public size: number;
    @Input() public color: string;
}