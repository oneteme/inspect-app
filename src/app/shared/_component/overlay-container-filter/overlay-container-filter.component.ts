import {Component, EventEmitter, Input, Output, TemplateRef} from "@angular/core";

@Component({
  selector: 'overlay-container-filter',
  templateUrl: './overlay-container-filter.component.html',
  styleUrls: ['./overlay-container-filter.component.scss']
})
export class OverlayContainerFilterComponent {
  @Input() templateContent: TemplateRef<any>;
  @Output() onReset: EventEmitter<any> = new EventEmitter();
  @Output() onClick: EventEmitter<any> = new EventEmitter();
}