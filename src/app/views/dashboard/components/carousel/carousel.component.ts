import { AfterViewInit, Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { TECH_CATALOG, TechDef } from 'src/app/views/constants';
import { APP_TECH_STACK } from 'src/app/config/tech-stack.config';

@Component({
    selector: 'dashboard-carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardCarouselComponent implements AfterViewInit {

    @ViewChild('techScrollTrack') techScrollTrack!: ElementRef<HTMLElement>;

    readonly techStack: (TechDef & { id: string; version?: string })[] = APP_TECH_STACK
        .map(entry => {
            const def = TECH_CATALOG[entry.id];
            return def ? { ...def, id: entry.id, version: entry.version } : null;
        })
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .sort((a, b) => a.order - b.order);

    canScrollLeft = false;
    canScrollRight = false;

    trackByTechId(_: number, tech: { id: string }): string { return tech.id; }

    getTechTitle(tech: TechDef & { id: string; version?: string }): string {
        const v = tech.version ? ' ' + tech.version : '';
        return tech.name + v;
    }

    ngAfterViewInit(): void {
        this._updateArrows();
        this.techScrollTrack?.nativeElement?.addEventListener('scroll', () => this._updateArrows(), { passive: true });
    }

    scrollLeft(): void {
        const el = this.techScrollTrack?.nativeElement;
        if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
    }

    scrollRight(): void {
        const el = this.techScrollTrack?.nativeElement;
        if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
    }

    private _updateArrows(): void {
        const el = this.techScrollTrack?.nativeElement;
        if (!el) return;
        this.canScrollLeft  = el.scrollLeft > 2;
        this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    }
}
