import {Component, inject, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {
  InspectCollectorConfiguration,
  InstanceEnvironment,
} from "../../../model/trace.model";

@Component({
  styleUrls: ['./config-dialog.component.scss'],
  templateUrl: 'config-dialog.component.html',
})
export class ConfigDialogComponent {
  highlightedJson: SafeHtml;
  rawJson: string = "";
  copied = false;

  private sanitizer = inject(DomSanitizer);

  constructor(@Inject(MAT_DIALOG_DATA) public data: {name: string, version: string, collector: string, config: InspectCollectorConfiguration}) {
    this.rawJson = JSON.stringify(data.config, null, 2);
    this.highlightedJson = this.sanitizer.bypassSecurityTrustHtml(this.syntaxHighlight(this.rawJson));
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.rawJson).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  private syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }
}