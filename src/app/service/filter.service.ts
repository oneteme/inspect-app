import { Injectable, OnDestroy, inject } from "@angular/core";
import { NavigationStart, Router } from "@angular/router";
import { BehaviorSubject, Observable, Subscription, catchError, combineLatest, first, map, of, throwError } from "rxjs";
import { FilterPreset, FilterMap } from "src/app/views/constants";

@Injectable({ providedIn: 'root' })
export class FilterService implements OnDestroy {

    private _router = inject(Router)

    routeSubscription: Subscription

    filters = new BehaviorSubject<FilterMap>({});
    otherfilters: Observable<FilterMap>;

    getOtherFilters: () => Observable<FilterMap>;


    constructor() {
        this.routeSubscription = this._router.events.subscribe((event: NavigationStart) => { // fix 
            this.filters.next({});
        });
    }

    registerGetallFilters(fns: () => Observable<FilterMap>) {
        this.getOtherFilters = fns;
    }

    savePreset(name: string, pn: string): Observable<FilterPreset> {

        if (!name)
            return throwError(() => new Error("preset name is missing! "));

        return combineLatest({
            filters: this.filters,
            otherfilters: this.getOtherFilters() || of({})
        }).pipe(map((f) => {
            const map = { ...f.filters, ...f.otherfilters };
            const presets: FilterPreset[] = this.getPresetsLocalStrorage(pn);
            const existingPresetNameIndex = presets.findIndex(p => p.name === name);
            let newPreset: FilterPreset = { name: name, pageName: pn, values: map };
            if (existingPresetNameIndex != -1) {
                presets[existingPresetNameIndex].values = map;
                newPreset = presets[existingPresetNameIndex];
            } else {
                const existingPresetValuesIndex = presets.findIndex(p => JSON.stringify(p.values) === JSON.stringify(map))
                if (existingPresetValuesIndex != -1) {
                    presets[existingPresetValuesIndex].name = name;
                    newPreset = presets[existingPresetValuesIndex];
                } else {
                    if (presets.length == 5) {
                        presets.shift();
                    }
                    presets.push(newPreset);
                }
            }
            localStorage.setItem(pn, JSON.stringify(presets))
            return newPreset;
        }))
            .pipe(
                catchError(error => {
                    console.error('error', error)
                    return of(null)
                })
            ).pipe(first());
    }

    removePreset(name: string, pn: string): FilterPreset {

        const presets = this.getPresetsLocalStrorage(pn);
        const removedPresetIndex = presets.findIndex((p: FilterPreset) => p.name == name);
        let removedPreset: FilterPreset;
        if (removedPresetIndex != -1) {
            removedPreset = presets[removedPresetIndex];
            presets.splice(removedPresetIndex, 1);
            localStorage.setItem(pn, JSON.stringify(presets))
            return removedPreset;
        }
    }

    setFilterMap(filterMap: FilterMap) {
        this.filters.next(filterMap);
    }

    ngOnDestroy(): void {
        this.routeSubscription.unsubscribe();
    }

    getPresetsLocalStrorage(pageName: string): FilterPreset[] {
        return JSON.parse(localStorage.getItem(pageName) || '[]');
    }
}