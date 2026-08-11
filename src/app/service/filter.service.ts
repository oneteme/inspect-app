import { Injectable, OnDestroy, inject } from "@angular/core";
import { NavigationStart, Router } from "@angular/router";
import { BehaviorSubject, Observable, Subscription, catchError, combineLatest, first, map, of, throwError } from "rxjs";
import { FilterPreset, FilterMap } from "src/app/views/constants";

@Injectable({ providedIn: 'root' })
/**
 * Handles filter state sharing and local preset persistence across views.
 */
export class FilterService implements OnDestroy {

    private _router = inject(Router)

    routeSubscription: Subscription

    filters = new BehaviorSubject<FilterMap>({});
    otherfilters: Observable<FilterMap>;

    getOtherFilters: () => Observable<FilterMap>;

    private lastUrl: string;

    constructor() {
        const getPath = (url: string) => url.split('?')[0];
        this.lastUrl = getPath(this._router.url);
        this.routeSubscription = this._router.events.subscribe((event: NavigationStart) => {
            if (event instanceof NavigationStart) {
                const nextPath = getPath(event.url);
                if (nextPath !== this.lastUrl) {
                    this.filters.next({});
                }
                this.lastUrl = nextPath;
            }
        });
    }

    /**
     * Registers a callback returning external filters managed outside this service.
     *
     * @param fns Function that returns current additional filters as an observable map.
     * @returns void once the callback is stored.
     */
    registerGetallFilters(fns: () => Observable<FilterMap>) {
        this.getOtherFilters = fns;
    }

    /**
     * Creates or updates a named preset in local storage for the given page.
     *
     * @param name Preset display name.
     * @param pn Local storage key (page name).
     * @returns Observable emitting the saved preset, or `null` when an error occurs.
     */
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

    /**
     * Removes one preset by name from local storage.
     *
     * @param name Preset name to remove.
     * @param pn Local storage key (page name).
     * @returns Removed preset object when found; otherwise `undefined`.
     */
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

    /**
     * Replaces the active filter map emitted to subscribers.
     *
     * @param filterMap Full map of active filters.
     * @returns void once the new map is published.
     */
    setFilterMap(filterMap: FilterMap) {
        this.filters.next(filterMap);
    }

    /**
     * Releases router subscription used to reset filters on route changes.
     *
     * @returns void when cleanup is complete.
     */
    ngOnDestroy(): void {
        this.routeSubscription.unsubscribe();
    }

    /**
     * Reads all presets for one page from local storage.
     *
     * @param pageName Local storage key used to store page presets.
     * @returns Parsed preset list, or an empty array when nothing is stored.
     */
    getPresetsLocalStrorage(pageName: string): FilterPreset[] {
        return JSON.parse(localStorage.getItem(pageName) || '[]');
    }
}