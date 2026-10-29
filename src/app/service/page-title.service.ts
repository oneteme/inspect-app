import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PageTitleConfig {
    title: string;
    icon: string;
    iconOutlined?: boolean;
    subtitle?: string;
}

@Injectable({ providedIn: 'root' })
export class PageTitleService {
    private readonly _config$ = new BehaviorSubject<PageTitleConfig | null>(null);
    readonly config$ = this._config$.asObservable();

    set(config: PageTitleConfig): void {
        this._config$.next(config);
    }

    clear(): void {
        this._config$.next(null);
    }
}
