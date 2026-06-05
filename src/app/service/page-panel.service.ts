import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagePanelService {
    private readonly _isOpen$ = new BehaviorSubject<boolean>(false);
    private readonly _hasPanel$ = new BehaviorSubject<boolean>(false);

    readonly isOpen$ = this._isOpen$.asObservable();
    readonly hasPanel$ = this._hasPanel$.asObservable();

    register(): void {
        this._hasPanel$.next(true);
    }

    unregister(): void {
        this._hasPanel$.next(false);
        this._isOpen$.next(false);
    }

    toggle(): void {
        this._isOpen$.next(!this._isOpen$.value);
    }

    close(): void {
        this._isOpen$.next(false);
    }
}
