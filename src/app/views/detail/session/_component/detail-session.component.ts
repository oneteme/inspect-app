import {Component, inject, Input, OnChanges, SimpleChanges} from "@angular/core";
import {EnvRouter} from "../../../../service/router.service";
import {MainSessionView, RestSessionView} from "../../../../model/request.model";
import {InstanceEnvironment} from "../../../../model/trace.model";

export interface TabData {
  label: string;
  icon: string;
  count: number;
  visible: boolean;
  type: string;
  hasError: boolean;
  errorCount: number;
}


@Component({
  selector: 'detail-session',
  templateUrl: './detail-session.component.html',
  styleUrls: ['./detail-session.component.scss']
})
export class DetailSessionComponent implements OnChanges {
  private readonly _router: EnvRouter = inject(EnvRouter);

  @Input() session: MainSessionView | RestSessionView;
  @Input() completedSession: MainSessionView | RestSessionView;
  @Input() instance: InstanceEnvironment;

  tabs: TabData[] = [];
  selectedTabIndex: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['completedSession'] && this.session) {
      this.initTabs();
    }
  }

  initTabs() {
    this.tabs = [
      {
        label: 'HTTP',
        icon: 'call_made',
        count: this.session.restRequests?.length || 0,
        visible: (this.session.requestsMask & 4) > 0,
        type: 'rest',
        hasError: this.hasRestErrors(),
        errorCount: this.getRestErrorCount()
      },
      {
        label: 'JDBC',
        icon: 'database',
        count: this.session.databaseRequests?.length || 0,
        visible: (this.session.requestsMask & 2) > 0,
        type: 'database',
        hasError: this.hasDatabaseErrors(),
        errorCount: this.getDatabaseErrorCount()
      },
      {
        label: 'FTP',
        icon: 'smb_share',
        count: this.session.ftpRequests?.length || 0,
        visible: (this.session.requestsMask & 8) > 0,
        type: 'ftp',
        hasError: this.hasFtpErrors(),
        errorCount: this.getFtpErrorCount()
      },
      {
        label: 'SMTP',
        icon: 'outgoing_mail',
        count: this.session.mailRequests?.length || 0,
        visible: (this.session.requestsMask & 16) > 0,
        type: 'smtp',
        hasError: this.hasSmtpErrors(),
        errorCount: this.getSmtpErrorCount()
      },
      {
        label: 'LDAP',
        icon: 'user_attributes',
        count: this.session.ldapRequests?.length || 0,
        visible: (this.session.requestsMask & 32) > 0,
        type: 'ldap',
        hasError: this.hasLdapErrors(),
        errorCount: this.getLdapErrorCount()
      },
      {
        label: 'LOCAL',
        icon: 'memory',
        count: this.session.localRequests?.length || 0,
        visible: (this.session.requestsMask & 1) > 0,
        type: 'local',
        hasError: this.hasLocalErrors(),
        errorCount: this.getLocalErrorCount()
      },
      {
        label: 'Stage',
        icon: 'view_object_track',
        count: 0,
        visible: !!this.session['httpSessionStages']?.length,
        type: 'stage',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Action',
        icon: 'web_traffic',
        count: this.session['userActions']?.length || 0,
        visible: !!this.session['userActions']?.length,
        type: 'action',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Log',
        icon: 'chat_info',
        count: this.session.logEntries?.length || 0,
        visible: !!this.session.logEntries?.length,
        type: 'log',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Chronologie',
        icon: 'view_timeline',
        count: 0,
        visible: true,
        type: 'timeline',
        hasError: false,
        errorCount: 0
      }
    ];

    // Sélectionner le premier onglet visible
    const firstVisibleIndex = this.tabs.findIndex(tab => tab.visible);
    if (firstVisibleIndex !== -1) {
      this.selectedTabIndex = firstVisibleIndex;
    }
  }

  // Méthodes pour calculer les erreurs
  private hasRestErrors(): boolean {
    return this.session.restRequests?.some(req => req.status && req.status >= 400) || false;
  }

  private getRestErrorCount(): number {
    return this.session.restRequests?.filter(req => req.status && req.status >= 400).length || 0;
  }

  private hasLocalErrors(): boolean {
    return this.session.localRequests?.some(req => req.exception) || false;
  }

  private getLocalErrorCount(): number {
    return this.session.localRequests?.filter(req => req.exception).length || 0;
  }

  private hasFtpErrors(): boolean {
    return this.session.ftpRequests?.some(req => req.failed) || false;
  }

  private getFtpErrorCount(): number {
    return this.session.ftpRequests?.filter(req => req.failed).length || 0;
  }

  private hasSmtpErrors(): boolean {
    return this.session.mailRequests?.some(req => req.failed) || false;
  }

  private getSmtpErrorCount(): number {
    return this.session.mailRequests?.filter(req => req.failed).length || 0;
  }

  private hasLdapErrors(): boolean {
    return this.session.ldapRequests?.some(req => req.failed) || false;
  }

  private getLdapErrorCount(): number {
    return this.session.ldapRequests?.filter(req => req.failed).length || 0;
  }

  private hasDatabaseErrors(): boolean {
    return this.session.databaseRequests?.some(req => req.failed) || false;
  }

  private getDatabaseErrorCount(): number {
    return this.session.databaseRequests?.filter(req => req.failed).length || 0;
  }

  selectedRemote(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/session/rest/${event.row}`, '_blank',)
      } else {
        this._router.navigate(['/session', 'rest', event.row], { queryParams: { env: this.instance.env } }); // TODO remove env FIX BUG
      }
    }
  }

  selectedRest(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/rest/${event.row}`, '_blank',)
      } else {
        this._router.navigate(['/request', 'rest', event.row], { queryParams: { env: this.instance.env } }); // TODO remove env FIX BUG
      }
    }
  }

  selectedFtp(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/ftp/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/ftp`, event.row], {
          queryParams: { env: this.instance.env }
        });
      }
    }
  }

  selectedLdap(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/ldap/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/ldap`, event.row], {
          queryParams: { env: this.instance.env }
        });
      }
    }
  }

  selectedSmtp(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/smtp/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/smtp`, event.row], {
          queryParams: { env: this.instance.env }
        });
      }
    }
  }

  selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/jdbc/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/jdbc`, event.row], {
          queryParams: { env: this.instance.env }
        });
      }
    }
  }
}