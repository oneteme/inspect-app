import { AfterViewChecked, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChatMessage } from './assistant-chat.models';
import { AssistantChatService } from './assistant-chat.service';

@Component({
  selector: 'app-assistant-chat-dialog',
  templateUrl: './assistant-chat-dialog.component.html',
  styleUrls: ['./assistant-chat-dialog.component.scss']
})
export class AssistantChatDialogComponent implements AfterViewChecked {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  private readonly dialogRef = inject(MatDialogRef<AssistantChatDialogComponent>);
  private readonly chatService = inject(AssistantChatService);

  messages: ChatMessage[] = [{
    role: 'assistant',
    content: 'Bonjour ! Je peux vous aider à analyser les données de cette application.'
  }];
  draft = '';
  isSending = false;
  private conversationId?: string;
  private shouldScroll = true;

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messageList) {
      this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    const content = this.draft.trim();
    if (!content || this.isSending) return;

    this.messages = [...this.messages, { role: 'user', content }];
    this.draft = '';
    this.isSending = true;
    this.shouldScroll = true;

    this.chatService.sendMessage({
      message: content,
      ...(this.conversationId ? { conversationId: this.conversationId } : {})
    }).subscribe({
      next: response => {
        this.conversationId = response.conversationId ?? this.conversationId;
        this.messages = [...this.messages, {
          role: 'assistant',
          content: response.answer
        }];
        this.isSending = false;
        this.shouldScroll = true;
      },
      error: error => {
        this.messages = [...this.messages, {
          role: 'assistant',
          content: this.getErrorMessage(error),
          isError: true
        }];
        this.isSending = false;
        this.shouldScroll = true;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Impossible de joindre le service de l’assistant. Vérifiez votre connexion puis réessayez.';
    }
    return 'La réponse de l’assistant n’a pas pu être obtenue. Réessayez dans quelques instants.';
  }
}
