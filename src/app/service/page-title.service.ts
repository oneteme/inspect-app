import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InstanceEnvironment } from '../model/trace.model';

export interface PageTitleConfig {
    title: string;
    icon: string;
    iconOutlined?: boolean;
    subtitle?: string;
    instanceContext?: {
        instance: Partial<InstanceEnvironment>;
        lastTrace?: number;
        date?: number;
    };
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
