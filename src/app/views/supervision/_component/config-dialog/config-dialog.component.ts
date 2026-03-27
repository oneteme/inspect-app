import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {InspectCollectorConfiguration} from "../../../../model/trace.model";

@Component({
  styleUrls: ['./config-dialog.component.scss'],
  templateUrl: 'config-dialog.component.html',
})
export class ConfigDialogComponent {
  readonly highlighted: string;
  copied = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: InspectCollectorConfiguration) {
    this.highlighted = this._highlight(JSON.stringify(data, null, 2));
  }

  copy(): void {
    navigator.clipboard.writeText(JSON.stringify(this.data, null, 2));
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

  private _highlight(json: string): string {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Regex simplifiée : clés JSON, strings, nombres, booléens/null
    return escaped.replace(/("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      (_m, key, str, bool, num) => {
        if (key)  return `<span class="jk">${key}:</span>`;
        if (str)  return `<span class="js">${str}</span>`;
        if (bool) return `<span class="jb">${bool}</span>`;
        return `<span class="ji">${num}</span>`;
      }
    );
  }
}