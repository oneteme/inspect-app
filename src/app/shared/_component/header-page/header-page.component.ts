import { Component, Input, TemplateRef } from "@angular/core";

@Component({
    selector: 'header-page',
    templateUrl: './header-page.component.html',
    styleUrls: ['./header-page.component.scss']
})
export class HeaderPageComponent {
    @Input() titleIcon: string;
    @Input() iconOutlined: boolean;
    @Input('ui-title') title: string;
    @Input('ui-subtitle') subTitle: string;
    @Input() templateSubTitle: TemplateRef<any>; 
}