import {Component, Input} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {ExceptionInfo, SessionEvent} from '../../../model/trace.model';

interface TimelineItem {
    kind: 'event' | 'exception';
    event?: SessionEvent;
    exception?: ExceptionInfo;
}

@Component({
    selector: 'session-timeline',
    templateUrl: './session-timeline.component.html',
    styleUrls: ['./session-timeline.component.scss']
})
export class SessionTimelineComponent {
    private _events: SessionEvent[] = [];
    private _exceptions: ExceptionInfo[] = [];
    readonly pageSizeOptions = [10, 50, 100];
    pageSize = 50;
    pageIndex = 0;
    displayedItems: TimelineItem[] = [];
    private _items: TimelineItem[] = [];

    @Input()
    set events(events: SessionEvent[] | null | undefined) {
        this._events = events ?? [];
        this.pageIndex = 0;
        this.updateDisplayedItems();
    }

    get events(): SessionEvent[] {
        return this._events;
    }

    @Input()
    set exceptions(exceptions: ExceptionInfo | ExceptionInfo[] | null | undefined) {
        if (!exceptions) {
            this._exceptions = [];
        } else if (Array.isArray(exceptions)) {
            this._exceptions = exceptions;
        } else {
            this._exceptions = [exceptions];
        }
        this.pageIndex = 0;
        this.updateDisplayedItems();
    }

    get exceptions(): ExceptionInfo[] {
        return this._exceptions;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageSize === this.pageSize ? event.pageIndex : 0;
        this.pageSize = event.pageSize;
        this.updateDisplayedItems();
    }

    private updateDisplayedItems(): void {
        this._items = [
            ...this.events.map(event => ({kind: 'event' as const, event})),
            ...this.exceptions.map(exception => ({kind: 'exception' as const, exception}))
        ].sort((first, second) => {
            const firstInstant = this.getItemInstant(first);
            const secondInstant = this.getItemInstant(second);

            if (firstInstant === null) {
                return 1;
            }
            if (secondInstant === null) {
                return -1;
            }
            return firstInstant - secondInstant;
        });
        const lastPage = Math.max(0, Math.ceil(this._items.length / this.pageSize) - 1);
        this.pageIndex = Math.max(0, Math.min(this.pageIndex, lastPage));
        const start = this.pageIndex * this.pageSize;
        this.displayedItems = this._items.slice(start, start + this.pageSize);
    }

    get itemCount(): number {
        return this._items.length;
    }

    getItemInstant(item: TimelineItem): number | null {
        if (item.kind === 'event') {
            return item.event?.instant ?? null;
        }

        const offset = item.exception?.offset;
        if (offset === undefined) {
            return null;
        }

        return this.normalizeTimestamp(offset);
    }

    getExceptionTimestamp(exception: ExceptionInfo): number | null {
        if (exception.offset === undefined) {
            return null;
        }

        return this.normalizeTimestamp(exception.offset);
    }

    private normalizeTimestamp(timestamp: number): number {
        // Les événements utilisent des secondes ; l'API peut fournir l'offset en ms.
        return Math.abs(timestamp) >= 100000000000 ? timestamp / 1000 : timestamp;
    }

    getItemCategory(item: TimelineItem): 'page' | 'user' | 'status' | 'exception' | 'unknown' {
        return item.kind === 'exception' ? 'exception' : this.getEventCategory(item.event?.type ?? '');
    }

    getItemLabel(item: TimelineItem): string {
        return item.kind === 'exception' ? 'Exception' : this.getEventLabel(item.event?.type ?? '');
    }

    getItemIcon(item: TimelineItem): string {
        // chat_error n'est pas disponible dans la police Material chargée par l'application.
        return item.kind === 'exception' ? 'chat_error' : this.getEventIcon(item.event?.type ?? '');
    }

    getItemCategoryLabel(item: TimelineItem): string {
        return item.kind === 'exception' ? 'Exception applicative' : this.getEventCategoryLabel(item.event?.type ?? '');
    }

    getElapsedTimeBetween(current: TimelineItem, next?: TimelineItem): string | null {
        if (!next) {
            return null;
        }

        const currentInstant = this.getItemInstant(current);
        const nextInstant = this.getItemInstant(next);

        if (currentInstant === null || nextInstant === null) {
            return null;
        }

        const elapsedMilliseconds = Math.round((nextInstant - currentInstant) * 1000);

        if (elapsedMilliseconds < 1000) {
            return `+ ${elapsedMilliseconds} ms`;
        }

        return `+ ${(elapsedMilliseconds / 1000).toFixed(3)} s`;
    }

    getEventLabel(type: string): string {
        switch (type) {
            case 'DOMContentLoaded':
                return 'Page prête';
            case 'DOC_VISIBLE':
                return 'Page au premier plan';
            case 'DOC_HIDDEN':
                return 'Page masquée';
            case 'click':
                return 'Clic';
            case 'dblclick':
                return 'Double-clic';
            case 'change':
                return 'Valeur modifiée';
            case 'scroll':
                return 'Défilement';
            case 'scrollend':
                return 'Fin du défilement';
            case 'resize':
                return 'Fenêtre redimensionnée';
            case 'zoom':
                return 'Zoom modifié';
            case 'info':
            case 'INFO':
                return '';
            case 'warn':
            case 'WARN':
                return '';
            case 'error':
            case 'ERROR':
                return '';
            default:
                return 'Autre événement';
        }
    }

    getEventIcon(type: string): string {
        switch (type) {
            case 'DOMContentLoaded':
                return 'language';
            case 'click':
                return 'ads_click';
            case 'dblclick':
                return 'mouse';
            case 'scroll':
                return 'swap_vert';
            case 'resize':
                return 'open_in_full';
            case 'zoom':
                return 'zoom_in';
            case 'DOC_HIDDEN':
                return 'visibility_off';
            case 'DOC_VISIBLE':
                return 'visibility';
            case 'change':
                return 'edit';
            case 'info':
            case 'INFO':
                return 'info';
            case 'warn':
            case 'WARN':
                return 'error';
            case 'error':
            case 'ERROR':
                return 'cancel';
            default:
                return 'radio_button_checked';
        }
    }

    getEventCategory(type: string): 'page' | 'user' | 'status' | 'unknown' {
        switch (type) {
            case 'DOMContentLoaded':
            case 'DOC_VISIBLE':
            case 'DOC_HIDDEN':
                return 'page';
            case 'resize':
            case 'click':
            case 'dblclick':
            case 'change':
            case 'scroll':
            case 'zoom':
                return 'user';
            case 'info':
            case 'INFO':
            case 'warn':
            case 'WARN':
            case 'error':
            case 'ERROR':
                return 'status';
            default:
                return 'unknown';
        }
    }

    getEventCategoryLabel(type: string): string {
        switch (this.getEventCategory(type)) {
            case 'page':
                return 'Événement de page';
            case 'user':
                return 'Action utilisateur';
            case 'status':
                return 'Message système';
            default:
                return 'Type d’événement inconnu';
        }
    }
}

