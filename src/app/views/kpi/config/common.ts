import {UnitConfig} from "@oneteme/jquery-core";
import {STATUS} from "../../constants";
import {statusColor} from "./colors";
import {ChartItem, ChartSection, SubmenuConfig} from "./types";

// Les durées (elapsed_time) sont fournies en secondes par le serveur.
export const DURATION_UNIT: UnitConfig = {
  baseUnit: 's',
  scales: [
    { unit: 'µs', scale: 1000000, threshold: 0.001 },
    { unit: 'ms', scale: 1000, threshold: 1 },
    { unit: 's', scale: 1, threshold: Infinity }
  ]
};

const STATUS_SUBMENU: SubmenuConfig = { id: 'statut', label: 'Statut', icon: 'task_alt' };

// Empilement des indicateurs de session par statut (valeur brute ou tranche).
export const STATUS_STACKS = (): ChartSection => ({
  optional: false,
  items: [{
    key: 'status_stack',
    selected: false,
    menu: {
      label: 'Statut'
    },
    submenu: { ...STATUS_SUBMENU, itemLabel: 'Valeur' },
    jquery: {
      value: () => 'status',
      buildAlias: () => 'status',
      buildName: (chartItem, value: string) => value,
      buildColor: (value: string) => statusColor(value)
    }
  }, {
    key: 'status_tranche',
    selected: true,
    menu: {
      label: 'Tranche'
    },
    submenu: STATUS_SUBMENU,
    jquery: {
      value: () => 'status_tranche',
      buildAlias: () => 'status_tranche',
      buildColor: (value: string) => STATUS[value].color,
      buildName: (chartItem, value) => STATUS[value].label
    }
  }]
});

// Entrées « Valeur » et « Tranche » du menu Filtrer par des pages de session.
export const STATUS_FILTER_ITEMS = (): ChartItem[] => [{
  key: 'status',
  selected: false,
  submenu: STATUS_SUBMENU,
  menu: {
    label: 'Valeur'
  },
  jquery: {
    value: () => 'status',
    buildAlias: () => 'status',
    order: 'status.asc'
  }
}, {
  key: 'status_tranche',
  selected: false,
  submenu: STATUS_SUBMENU,
  menu: {
    label: 'Tranche'
  },
  jquery: {
    value: () => 'status_tranche',
    buildAlias: () => 'status_tranche',
    order: 'status_tranche.asc'
  }
}];

const USER_AGENT_SUBMENU: SubmenuConfig = { id: 'userAgent', label: 'User-Agent', icon: 'devices' };

// Entrées « Valeur » et « Produit » (agent connu ou « Autre ») du menu User-Agent.
export const USER_AGENT_ITEMS = (): ChartItem[] => [{
  key: 'userAgent',
  selected: false,
  submenu: USER_AGENT_SUBMENU,
  menu: {
    label: 'Valeur'
  },
  jquery: {
    value: () => `user_agt.coalesce("Unknown")`,
    buildAlias: () => 'userAgent',
    buildName: (chartItem, value: string) => value,
    order: 'userAgent.asc'
  }
}, {
  key: 'userAgentProduct',
  selected: false,
  submenu: USER_AGENT_SUBMENU,
  menu: {
    label: 'Produit'
  },
  jquery: {
    value: () => 'user_agt_product',
    buildAlias: () => 'userAgentProduct',
    buildName: (chartItem, value: string) => value,
    order: 'userAgentProduct.asc'
  }
}];

export const statusTrancheLabel = (value: string): string => STATUS[value]?.label ?? value;
