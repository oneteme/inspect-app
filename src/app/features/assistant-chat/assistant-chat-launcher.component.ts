import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AssistantChatDialogComponent } from './assistant-chat-dialog.component';

@Component({
  selector: 'app-assistant-chat-launcher',
  template: `
    <button
      mat-fab
      color="primary"
      class="assistant-chat-launcher"
      aria-label="Ouvrir le chat avec l'assistant"
      matTooltip="Assistant IA"
      (click)="openChat()">
      <mat-icon>smart_toy</mat-icon>
    </button>
  `,
  styles: [`
    .assistant-chat-launcher {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
      width: 52px !important;
      height: 52px !important;
    }

    @media (max-width: 600px) {
      .assistant-chat-launcher {
        right: 16px;
        bottom: 16px;
      }
    }
  `]
})
export class AssistantChatLauncherComponent {
  private readonly dialog = inject(MatDialog);

  openChat(): void {
    this.dialog.open(AssistantChatDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      height: 'min(640px, calc(100vh - 112px))',
      maxHeight: 'calc(100vh - 112px)',
      position: { bottom: '88px', right: '24px' },
      panelClass: 'assistant-chat-dialog-panel',
      ariaLabel: 'Chat avec l’assistant IA',
      autoFocus: 'textarea',
      restoreFocus: true
    });
  }
}
