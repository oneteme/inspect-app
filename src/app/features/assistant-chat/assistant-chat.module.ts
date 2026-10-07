
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AssistantChatDialogComponent } from './assistant-chat-dialog.component';
import { AssistantChatLauncherComponent } from './assistant-chat-launcher.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  declarations: [
    AssistantChatDialogComponent,
    AssistantChatLauncherComponent
  ],
  exports: [AssistantChatLauncherComponent]
})
export class AssistantChatModule {}
