import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from "@angular/core";

export interface TabData {
  label: string;
  icon: string;
  count: number;
  visible: boolean;
  type: string;
  hasError: boolean;
  errorCount: number;
}

@Component({
  selector: 'app-vertical-tabs',
  templateUrl: './vertical-tabs.component.html',
  styleUrls: ['./vertical-tabs.component.scss']
})
export class VerticalTabsComponent {
  @Input() tabs: TabData[] = [];
  @Input() selectedIndex: number = 0;
  @Output() selectedIndexChange = new EventEmitter<number>();

  collapsed = false;

  @ViewChildren('tabEl') private tabElements: QueryList<ElementRef<HTMLButtonElement>>;

  select(index: number) {
    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  onKeydown(event: KeyboardEvent) {
    const visibleIndexes = this.tabs
      .map((tab, index) => (tab.visible ? index : -1))
      .filter(index => index >= 0);
    if (visibleIndexes.length === 0) {
      return;
    }

    const position = Math.max(visibleIndexes.indexOf(this.selectedIndex), 0);
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = visibleIndexes[(position + 1) % visibleIndexes.length];
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = visibleIndexes[(position - 1 + visibleIndexes.length) % visibleIndexes.length];
        break;
      case 'Home':
        next = visibleIndexes[0];
        break;
      case 'End':
        next = visibleIndexes[visibleIndexes.length - 1];
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    this.tabElements.get(next)?.nativeElement.focus();
  }
}
