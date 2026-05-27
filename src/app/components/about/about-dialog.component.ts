import { Component } from '@angular/core';
import { TECH_CATALOG, TechDef } from 'src/app/views/constants';
import { APP_TECH_STACK } from 'src/app/config/tech-stack.config';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent {

  readonly techStack: (TechDef & { id: string; version?: string })[] = APP_TECH_STACK
    .map(entry => {
      const def = TECH_CATALOG[entry.id];
      return def ? { ...def, id: entry.id, version: entry.version } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => a.order - b.order);

  trackByTechId(_: number, tech: { id: string }): string { return tech.id; }

  getTechTitle(tech: TechDef & { id: string; version?: string }): string {
    return tech.name + (tech.version ? ' ' + tech.version : '');
  }
}
