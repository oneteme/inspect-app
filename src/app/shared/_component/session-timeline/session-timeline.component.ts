import {Component, Input} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {SessionEvent} from '../../../model/trace.model';

@Component({
    selector: 'session-timeline',
    templateUrl: './session-timeline.component.html',
    styleUrls: ['./session-timeline.component.scss']
})
export class SessionTimelineComponent {
    private _events: SessionEvent[] = [];
    readonly pageSizeOptions = [25, 50, 100];
    pageSize = 50;
    pageIndex = 0;
    displayedEvents: SessionEvent[] = [];

    @Input()
    set events(events: SessionEvent[] | null | undefined) {
        this._events = events ?? [];
        this.pageIndex = 0;
        this.updateDisplayedEvents();
    }

    get events(): SessionEvent[] {
        return this._events;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageSize === this.pageSize ? event.pageIndex : 0;
        this.pageSize = event.pageSize;
        this.updateDisplayedEvents();
    }

    private updateDisplayedEvents(): void {
        const lastPage = Math.max(0, Math.ceil(this.events.length / this.pageSize) - 1);
        this.pageIndex = Math.max(0, Math.min(this.pageIndex, lastPage));
        const start = this.pageIndex * this.pageSize;
        this.displayedEvents = this.events.slice(start, start + this.pageSize);
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
            default:
                return 'Autre événement';
        }
    }

    getElapsedTime(current: SessionEvent, previous?: SessionEvent): string | null {
        if (!current || !previous) {
            return null;
        }

        const elapsedMilliseconds = Math.round((previous.instant - current.instant) * 1000);

        if (elapsedMilliseconds < 1000) {
            return `+ ${elapsedMilliseconds} ms`;
        }

        return `+ ${(elapsedMilliseconds / 1000).toFixed(3)} s`;
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
            default:
                return 'radio_button_checked';
        }
    }

    getEventCategory(type: string): 'page' | 'user' | 'unknown' {
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
            default:
                return 'Type d’événement inconnu';
        }
    }
}

