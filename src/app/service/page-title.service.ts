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
/**
 * Stores and broadcasts the current page title configuration.
 */
export class PageTitleService {
    private readonly _config$ = new BehaviorSubject<PageTitleConfig | null>(null);
    readonly config$ = this._config$.asObservable();

    /**
     * Publishes a new title configuration to all subscribers.
     *
     * @param config Title payload containing label, icon and optional context.
     * @returns void once the new configuration is emitted.
     */
    set(config: PageTitleConfig): void {
        this._config$.next(config);
    }

    /**
     * Clears the current title configuration.
     *
     * @returns void once subscribers receive an empty title state.
     */
    clear(): void {
        this._config$.next(null);
    }
}
