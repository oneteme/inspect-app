import {forkJoin, map, Observable} from "rxjs";
import {applyFilterSelections, ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";

/** Granularité composite « jour + heure » (une requête par jour pour un filtre exact, cf. buildSelectionRequests). */
export const DATE_HOUR_GROUPED_BY = 'dateHour';
export const DATE_HOUR_COLUMNS = 'start.monthDay.varchar:day,start.hour.varchar:hour';
export const DATE_HOUR_ORDER = 'start.monthDay.asc,start.hour.asc';

/** Le serveur ne groupe pas sur jour + heure en une seule colonne : on groupe sur deux colonnes, puis on les assemble en `MM-dd HH`. */
export function packDateHour(rows: any[], alias: string): any[] {
    return rows.map(({ day, hour, ...rest }) => ({ ...rest, [alias]: `${day} ${hour}` }));
}

export function isDateHour(groupedBy: string | undefined, filterKey: string): boolean {
    return groupedBy === DATE_HOUR_GROUPED_BY && filterKey === 'date';
}

export function groupColumn(group: ChartItem, dateHour: boolean): string {
    return dateHour ? DATE_HOUR_COLUMNS : `${group.jquery.value()}:${group.jquery.buildAlias()}`;
}

export function groupOrder(group: ChartItem, dateHour: boolean): string | undefined {
    return dateHour ? DATE_HOUR_ORDER : group.jquery.order;
}

/**
 * Requêtes à envoyer pour les sélections. En « jour + heure », une requête par jour : chaque couple (jour, heure)
 * coché reste exact et les lignes de jours différents ne se mélangent pas.
 */
export function buildSelectionRequests(args: any, selections: ChartFilterSelection[] | undefined, dateHour: boolean): any[] {
    const dateSelection = dateHour ? selections?.find(s => s.filter.key === 'date' && s.values?.length) : undefined;
    const parts = dateSelection?.values.map(v => v.split(' ')).filter(([day, hour]) => day && hour) ?? [];
    if (!dateSelection || !parts.length) {
        const request = { ...args };
        applyFilterSelections(request, selections);
        return [request];
    }

    const others = selections?.filter(s => s !== dateSelection);
    const days = [...new Set(parts.map(([day]) => day))];
    return days.map(day => {
        const request = { ...args };
        applyFilterSelections(request, others);
        request['start.monthDay.varchar.in'] = day;
        request['start.hour.varchar.in'] = [...new Set(parts.filter(([d]) => d === day).map(([, hour]) => hour))].join(',');
        return request;
    });
}

/** Envoie les requêtes (une par jour en « jour + heure ») et fusionne les lignes ; `groupAlias` reçoit la valeur composite. */
export function fetchGroupedRows(send: (args: any) => Observable<any[]>, args: any, selections: ChartFilterSelection[] | undefined,
                                 dateHour: boolean, groupAlias: string): Observable<any[]> {
    return forkJoin(buildSelectionRequests(args, selections, dateHour).map(request => send(request))).pipe(
        map(results => {
            const rows = results.flat();
            return dateHour ? packDateHour(rows, groupAlias) : rows;
        })
    );
}
