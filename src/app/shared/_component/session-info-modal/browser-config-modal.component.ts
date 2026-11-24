import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {catchError, finalize, of, Subject, takeUntil} from "rxjs";
import {BrowserConfigDto} from "../../../model/trace.model";
import {JQueryService} from "../../../service/jquery/jquery.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";


const BROWSER_ICONS_MAP = new Map<string, string>([
    ['Chrome', 'browser-chrome.svg'],
    ['Firefox', 'browser-firefox.svg'],
    ['Edge', 'browser-edge.svg'],
    ['Safari', 'browser-safari.svg']
]);


interface BrowserConfigView extends BrowserConfigDto {
    isLandscape: boolean;
    connectivityLabel: string;
    connectivityQuality: number;
    os?: string;
    re?: string;
    browser: string;
    osTooltip?: string;
    reTooltip?: string;
}

@Component({
    templateUrl: './browser-config-modal.component.html',
    styleUrls: ['./browser-config-modal.component.scss']
})
export class BrowserConfigModalComponent implements OnInit, OnDestroy {
    private readonly _jqueryService = inject(JQueryService);
    private readonly _data = inject<{ instanceId: string, os?: string, re?: string }>(MAT_DIALOG_DATA);
    private readonly _destroy$ = new Subject<void>();

    isLoading = true;
    configs: BrowserConfigView[] = [];
    osTooltip: string = "Résolution de l'écran";
    reTooltip: string = "Résolution de la page";

    ngOnInit(): void {
        this._jqueryService.getBrowserConfig({instanceId: [this._data.instanceId]})
            .pipe(catchError(() => of([])),
                finalize(() => this.isLoading = false),
                takeUntil(this._destroy$))
            .subscribe(configs =>
                this.configs = configs.map(c =>
                    this.toView(c)));
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private toView(config: BrowserConfigDto): BrowserConfigView {
        const connectivity = config.deviceConnectivity;
        return {
            ...config,
            os: this._data.os,
            re: this._data.re,
            osTooltip: this.isWindows(this._data.os) ? `Résolution de l'écran (${this._data.os})` : this.osTooltip,
            reTooltip: this.getBrowserIconPath(this._data.re) ? `Résolution de la page (${this._data.re})` : this.reTooltip,
            browser: this.getBrowser(this._data.re),
            isLandscape: (config.deviceOrientation || '').startsWith('landscape'),
            connectivityLabel: connectivity && connectivity !== 'unknown'
                ? connectivity.replace(/^\D*/, '').toUpperCase()
                : '',
            connectivityQuality: connectivity && connectivity !== 'slow-2g' ? Number(connectivity[0]) : 2
        };
    }

    private getBrowser(re: string): string {
        return (re || '').toLowerCase().split('/')[0].trim();
    }

    // Windows is the only icon available
    isWindows(os: string): boolean {
        return (os || '').toLowerCase().includes('windows');
    }

    userTheme(userTheme: string): string {
        return userTheme === 'dark' ? 'Mode sombre' : 'Mode clair';
    }

    getBrowserIconPath(re: string): string | null {
        const value = (re || '').toLowerCase();
        for (const [key, fileName] of BROWSER_ICONS_MAP.entries()) {
            if (value.includes(key.toLowerCase())) {
                return `assets/browser/${fileName}`;
            }
        }
        return null;
    }

}