import { Component, HostListener, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { PagePanelService } from '../../../service/page-panel.service';

@Component({
    selector: 'page-panel',
    templateUrl: './page-panel.component.html',
    styleUrls: ['./page-panel.component.scss']
})
export class PagePanelComponent implements OnInit, OnDestroy {
    @Input() panelTitle = 'Parametres';
    @Input() panelIcon = 'tune';

    private readonly _svc = inject(PagePanelService);
    readonly isOpen$ = this._svc.isOpen$;

    ngOnInit(): void {
        this._svc.register(this.panelIcon);
    }

    ngOnDestroy(): void {
        this._svc.unregister();
    }

    onPanelEnter(): void {
        this._svc.cancelClose();
    }

    onPanelLeave(): void {
        this._svc.scheduleClose(350);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this._svc.close();
    }
}