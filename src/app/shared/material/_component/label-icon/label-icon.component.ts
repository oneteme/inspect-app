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
            gap: 0.5em;
        }
        mat-icon {
            flex-shrink: 0;
            transition: transform 0.2s ease;
        }
        div {
            line-height: 1.5;
        }
    `]
})
export class LabelIconComponent {
    @Input() public icon: string;
    @Input() public iconOutlined = true;
    @Input() public size: number = 24;
    @Input() public color: string;
}