import {Component, Input} from "@angular/core";
import {Mail} from "../../../../../../model/trace.model";
import {DEFAULT_TABLE_CONFIG} from "../../../../../../shared/_component/table/table.config";
import {TableProvider} from '../../../../../../../../../../jarvis/jquery-charts/dist/oneteme/jquery-table';

@Component({
  selector: 'request-mail-table',
  templateUrl: './mail-table.component.html',
  styleUrls: ['./mail-table.component.scss']
})
export class MailTableComponent {
  tableConfig: TableProvider<Mail> = {
    ...DEFAULT_TABLE_CONFIG,
    columns: [
      { key: 'subject', header: 'Objet', icon: 'subject', sliceable: false, groupable: false },
      { key: 'from', header: 'De', icon: 'person', sliceable: false, groupable: false, sortable: false },
      { key: 'recipients', header: 'A', icon: 'group', sliceable: false, groupable: false, sortable: false },
      { key: 'replyTo', header: 'Cc', icon: 'reply', sliceable: false, groupable: false, sortable: false }
    ],
    defaultSort: { active: 'subject', direction: 'asc' }
  };

  _mails: Mail[] = [];

  @Input() set mails(mails: Mail[]) {
    this._mails = mails;
  }
}