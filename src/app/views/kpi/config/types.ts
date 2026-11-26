import {UnitConfig} from "@oneteme/jquery-core";

export interface SubmenuConfig {
  id: string;
  label: string;
  itemLabel?: string;  // libellé de l'entrée dans le sous-menu, sans toucher à l'axe X
  icon?: string;
  iconSvg?: string;
}

export interface ChartItem<TExtra = {}> {
  key: string;
  selected: boolean;
  menu: MenuConfig;  // affichage
  jquery: JQueryConfig;  // requête
  group?: string;  // regroupement indicateurs ex "Durées"
  submenu?: SubmenuConfig;  // sous-menu commun dans « Grouper par » / « Filtrer par »
  unit?: string | UnitConfig;  // unité simple ('ms', 'o', '%') ou config dynamique avec auto-scaling
  extra?: TExtra;  // données spécifiques au type d'item
}

export interface ChartSection<TExtra = {}> {
  optional: boolean;
  items: ChartItem<TExtra>[];
}

/** Valeurs retenues pour un filtre : plusieurs filtres peuvent être actifs en même temps (ET entre filtres, OU entre valeurs). */
export interface ChartFilterSelection {
  filter: ChartItem;
  values: string[];
}

export interface IndicatorExtra {
  stacks?: ChartSection;  // stacks disponibles pour cet indicateur
}

export interface ChartConfig {
  series: ChartSection;
  indicators: ChartSection<IndicatorExtra>;
  groups: ChartSection;
  filters?: ChartSection;
  stacked?: boolean;  // absent = empilé
}

export interface MenuConfig {
  label: string;
  icon?: string;
  iconSvg?: string;
}

export interface JQueryConfig {
  value: (value?: string) => string;
  buildAlias: (value?: string) => string;
  buildName?: (chartItem: ChartItem, value?: string | number) => string;
  buildColor?: (value?: string | number) => string;
  order?: string;
  buildCriteria?: (values: string[]) => Record<string, string>;  // critères serveur d'une sélection, à la place de `<value>.in`
}
