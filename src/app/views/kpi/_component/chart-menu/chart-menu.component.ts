import {Component, EventEmitter, Input, Output} from "@angular/core";
import {ChartConfig, ChartItem, IndicatorExtra} from "../../kpi.config";

@Component({
  selector: 'chart-menu',
  templateUrl: './chart-menu.component.html',
  styleUrls: ['./chart-menu.component.scss']
})
export class ChartMenuComponent {

  @Input() config: Partial<ChartConfig>;

  /** Émis à chaque fois qu'une sélection change → le parent relance sa requête */
  @Output() configChange: EventEmitter<'filter' | 'default'> = new EventEmitter<'filter' | 'default'>();

  // ─── Actions ─────────────────────────────────────────────────────────────────
  get actualIndicator(): ChartItem<IndicatorExtra> | undefined {
    return this.config?.indicators?.items?.find(i => i.selected);
  }

  get actualGroup(): ChartItem | undefined {
    return this.config?.groups?.items?.find(i => i.selected);
  }

  get actualStack(): ChartItem | undefined {
    return this.actualIndicator?.extra?.stacks?.items?.find(s => s.selected);
  }

  get actualFilter(): ChartItem | undefined {
    return this.config?.filters?.items?.find(i => i.selected);
  }

  selectIndicator(item: ChartItem<IndicatorExtra>): void {
    if (item.selected) return;
    this.config.indicators.items.forEach(i => {
      i.selected = false;
      i.extra?.stacks.items.forEach(s => s.selected = false);
    });
    item.selected = true;
    // Réinitialiser les stacks du nouvel indicateur
    this.configChange.emit('default');
  }

  selectGroup(item: ChartItem): void {
    if (item.selected) return;
    this.config.groups.items.forEach(i => i.selected = false);
    item.selected = true;
    this.configChange.emit('default');
  }

  /**
   * Active/désactive un stack.
   * Si le stack appartient à un indicateur non sélectionné, sélectionne cet indicateur.
   * Un seul stack peut être actif à la fois par indicateur.
   */
  toggleStack(indicator: ChartItem<IndicatorExtra>, item: ChartItem): void {
    indicator.extra.stacks.items.forEach(s => s.selected = false);
    this.config.indicators.items.forEach(i => i.selected = false);
    item.selected = true;
    indicator.selected = true;
    this.configChange.emit('default');
  }

  selectFilter(item: ChartItem): void {
    if (!this.config.filters) return;
    this.config.filters.items.filter(i => i.key != item.key).forEach(i => i.selected = false);
    item.selected = !item.selected;
    this.configChange.emit('filter');
  }
}
