import {Component, Input} from "@angular/core";

@Component({
    selector: 'app-branch-chip',
    template: `
      <div class="info-chip branch-chip" *ngIf="branch">
        <mat-icon class="material-symbols-outlined chip-icon">code_blocks</mat-icon>
        <span class="chip-value ellipsis">{{ branch }}</span>
        <span class="chip-sep" *ngIf="hash">/</span>
        <span class="chip-hash" *ngIf="hash">{{ hash | slice:0:7 }}</span>
      </div>
  `,
    styles: [`
        .branch-chip {
            background: #faf5ff;
            border-color: #e9d8fd;
            .chip-icon { color: #7c3aed; }
            .chip-value { color: #5b21b6; }
            .chip-hash {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 11px;
                color: #7c3aed;
                opacity: 0.8;
            }
        }
  `]
})
export class BranchChipComponent {
    @Input() hash: string;
    @Input() branch: string;
}