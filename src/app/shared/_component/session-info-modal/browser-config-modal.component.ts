import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {catchError, finalize, of, Subject, takeUntil} from "rxjs";
import {BrowserConfigDto} from "../../../model/trace.model";
import {JQueryService} from "../../../service/jquery/jquery.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

interface BrowserConfigView extends BrowserConfigDto {
    isLandscape: boolean;
    connectivityLabel: string;
    connectivityQuality: number;
    os: string;
    re: string;
    browser: string;
}

@Component({
    templateUrl: './browser-config-modal.component.html',
    styleUrls: ['./browser-config-modal.component.scss']
})
export class BrowserConfigModalComponent implements OnInit, OnDestroy {
    private readonly _jqueryService = inject(JQueryService);
    private readonly _data = inject<{ instanceId: string, os: string, re: string }>(MAT_DIALOG_DATA);
    private readonly _destroy$ = new Subject<void>();

    isLoading = true;
    configs: BrowserConfigView[] = [];

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
        return {
            ...config,
            os: this._data.os,
            re: this._data.re,
            browser: this.getBrowser(this._data.re),
            isLandscape: (config.deviceOrientation || '').startsWith('landscape'),
            connectivityLabel: config.deviceConnectivity !== 'unknown'
                ? config.deviceConnectivity.replace(/^\D*/, '').toUpperCase()
                : '',
            connectivityQuality: (config.deviceConnectivity !== 'slow-2g' ? Number((config.deviceConnectivity[0])) : 2)
        };
    }

    private getBrowser(re: string): string {
        return re.toLowerCase().split('/')[0].trim();
    }

    userTheme(userTheme: string): string {
        return userTheme === 'dark' ? 'Mode sombre' : 'Mode clair';
    }

}