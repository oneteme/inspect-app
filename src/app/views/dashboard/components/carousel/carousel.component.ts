import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { TECH_CATALOG, TechDef } from 'src/app/views/constants';
import { APP_TECH_STACK } from 'src/app/config/tech-stack.config';

@Component({
    selector: 'dashboard-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardCarouselComponent implements AfterViewInit, OnDestroy {

    private _ngZone = inject(NgZone);

    @ViewChild('techScrollOuter') techScrollOuter!: ElementRef<HTMLElement>;
    @ViewChild('techScrollTrack') techScrollTrack!: ElementRef<HTMLElement>;

    private _techScrollRaf: number | null = null;
    private _techScrollPos = 0;
    private _techScrollPaused = false;
    private readonly _techScrollSpeed = 0.4;
    private _techScrollCleanup: (() => void) | null = null;

    readonly techStack: (TechDef & { id: string; version?: string })[] = APP_TECH_STACK
        .map(entry => {
            const def = TECH_CATALOG[entry.id];
            return def ? { ...def, id: entry.id, version: entry.version } : null;
        })
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .sort((a, b) => a.order - b.order);

    readonly techRepeat = [0, 1];

    trackByTechId(_: number, tech: { id: string }): string { return tech.id; }
    trackByRepeatIdx(i: number): number { return i; }

    getTechTitle(tech: TechDef & { id: string; version?: string }): string {
        const v = tech.version ? ' ' + tech.version : '';
        return tech.name + v;
    }

    ngAfterViewInit(): void {
        this._startTechAutoScroll();
    }

    ngOnDestroy(): void {
        if (this._techScrollRaf !== null) {
            cancelAnimationFrame(this._techScrollRaf);
        }
        this._techScrollCleanup?.();
    }

    private _startTechAutoScroll(): void {
        const outer = this.techScrollOuter?.nativeElement;
        const el = this.techScrollTrack?.nativeElement;
        if (!el || !outer) return;
        this._ngZone.runOutsideAngular(() => {
            const onEnter = () => { this._techScrollPaused = true; };
            const onLeave = () => { this._techScrollPaused = false; };
            const onWheel = (event: WheelEvent) => {
                event.preventDefault();
                const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
                this._techScrollPos += delta;
                const half = el.scrollWidth / 2;
                if (half > 0) {
                    if (this._techScrollPos >= half) this._techScrollPos -= half;
                    if (this._techScrollPos < 0) this._techScrollPos += half;
                }
                el.scrollLeft = this._techScrollPos;
            };
            outer.addEventListener('mouseenter', onEnter);
            outer.addEventListener('mouseleave', onLeave);
            outer.addEventListener('wheel', onWheel, { passive: false });
            this._techScrollCleanup = () => {
                outer.removeEventListener('mouseenter', onEnter);
                outer.removeEventListener('mouseleave', onLeave);
                outer.removeEventListener('wheel', onWheel);
            };
            const step = () => {
                if (!this._techScrollPaused) {
                    this._techScrollPos += this._techScrollSpeed;
                    const half = el.scrollWidth / 2;
                    if (half > 0 && this._techScrollPos >= half) {
                        this._techScrollPos -= half;
                    }
                    el.scrollLeft = this._techScrollPos;
                }
                this._techScrollRaf = requestAnimationFrame(step);
            };
            this._techScrollRaf = requestAnimationFrame(step);
        });
    }
}
