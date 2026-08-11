import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
/**
 * Manages the lifecycle and visibility state of the shared side panel.
 */
export class PagePanelService {
    private readonly _isOpen$ = new BehaviorSubject<boolean>(false);
    private readonly _hasPanel$ = new BehaviorSubject<boolean>(false);

    readonly isOpen$ = this._isOpen$.asObservable();
    readonly hasPanel$ = this._hasPanel$.asObservable();

    /**
     * Marks the panel as available in the current view.
     *
     * @returns void once the availability flag is updated.
     */
    register(): void {
        this._hasPanel$.next(true);
    }

    /**
     * Marks the panel as unavailable and forces it closed.
     *
     * @returns void once both availability and visibility are reset.
     */
    unregister(): void {
        this._hasPanel$.next(false);
        this._isOpen$.next(false);
    }

    /**
     * Switches the panel state between open and closed.
     *
     * @returns void once the new visibility state is emitted.
     */
    toggle(): void {
        this._isOpen$.next(!this._isOpen$.value);
    }

    /**
     * Closes the panel without changing its availability state.
     *
     * @returns void once the panel visibility is set to closed.
     */
    close(): void {
        this._isOpen$.next(false);
    }
}
