import {Component, inject, Input} from "@angular/core";
import {InspectCollectorConfiguration} from "../../../model/trace.model";
import {ConfigDialogComponent} from "../../../views/supervision/_component/config-dialog/config-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
    selector: 'app-branch-hash-badge',
    template: `
    <div class="branch-info" *ngIf="branch">
        <mat-icon class="material-symbols-outlined">code_blocks</mat-icon>
        {{ branch }} / {{ hash | slice:0:7 }}
    </div>
  `,
    styles: [`
        .branch-info {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
            border: 1px solid #ddd6fe;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #5b21b6;
            line-height: 1;
            max-width: 240px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 2px 4px rgba(91, 33, 182, 0.08);

            mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
                color: #7c3aed;
                flex-shrink: 0;
            }
        }
  `]
})
export class BranchHashBadgeComponent {
    @Input() hash: string;
    @Input() branch: string;
}