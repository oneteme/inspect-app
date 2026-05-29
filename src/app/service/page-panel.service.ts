import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagePanelService {
    private readonly _isOpen$ = new BehaviorSubject<boolean>(false);
    private readonly _hasPanel$ = new BehaviorSubject<boolean>(false);
    private _closeTimer: ReturnType<typeof setTimeout> | null = null;
    private _openedAt = 0;

    readonly isOpen$ = this._isOpen$.asObservable();
    readonly hasPanel$ = this._hasPanel$.asObservable();

    register(): void {
        this._hasPanel$.next(true);
    }

    unregister(): void {
        this._cancelClose();
        this._hasPanel$.next(false);
        this._isOpen$.next(false);
    }

    toggle(): void {
        this._cancelClose();
        this._isOpen$.next(!this._isOpen$.value);
    }

    open(): void {
        this._cancelClose();
        if (!this._isOpen$.value) this._openedAt = Date.now();
        this._isOpen$.next(true);
    }

    closeIfNotJustOpened(graceMs = 400): void {
        if (Date.now() - this._openedAt < graceMs) return;
        this.close();
    }

    scheduleClose(delay = 250): void {
        this._cancelClose();
        if (this._hasCdkOverlay()) return;
        this._closeTimer = setTimeout(() => {
            if (this._hasCdkOverlay()) { this._closeTimer = null; return; }
            this._isOpen$.next(false);
            this._closeTimer = null;
        }, delay);
    }

    cancelClose(): void {
        this._cancelClose();
    }

    close(): void {
        this._cancelClose();
        this._isOpen$.next(false);
    }

    private _cancelClose(): void {
        if (this._closeTimer !== null) {
            clearTimeout(this._closeTimer);
            this._closeTimer = null;
        }
    }

    private _hasCdkOverlay(): boolean {
        const c = document.querySelector('.cdk-overlay-container');
        return !!(c && c.children.length > 0);
    }
}
