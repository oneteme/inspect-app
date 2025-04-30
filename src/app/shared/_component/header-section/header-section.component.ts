import {Component, Input} from "@angular/core";

@Component({
    selector: 'header-section',
    templateUrl: './header-section.component.html',
    styleUrls: ['./header-section.component.scss']
})
export class HeaderSectionComponent {
    @Input() icon: string;
    @Input() size: number = 24;
    @Input() iconOutlined = true;
}