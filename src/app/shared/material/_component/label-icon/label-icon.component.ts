import {Component, Input} from "@angular/core";

@Component({
    selector: 'label-icon',
    template: `
        <mat-icon
            [ngClass]="{ 'material-symbols-outlined': iconOutlined }"
            [ngStyle]="{ color : color, 'width.px': size, 'height.px': size, 'font-size.px': size}"
        >{{ icon }}</mat-icon>
        <div [ngStyle]="{'font-size.px': size - 6}">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        :host {
            display: flex; 
            align-items: center;
        }
        mat-icon {
            margin-right: 0.5em;
        }
    `]
})
export class LabelIconComponent {
    @Input() public icon: string;
    @Input() public iconOutlined = true;
    @Input() public size: number = 24;
    @Input() public color: string;
}