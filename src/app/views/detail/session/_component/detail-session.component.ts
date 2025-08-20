import {Component, inject, Input} from "@angular/core";
import {EnvRouter} from "../../../../service/router.service";
import {MainSessionView, RestSessionView} from "../../../../model/request.model";
import {InstanceEnvironment} from "../../../../model/trace.model";

@Component({
    selector: 'detail-session',
    templateUrl: './detail-session.component.html',
    styleUrls: ['./detail-session.component.scss']
})
export class DetailSessionComponent {
    private readonly _router: EnvRouter = inject(EnvRouter);

    @Input() session: MainSessionView | RestSessionView;
    @Input() completedSession: MainSessionView | RestSessionView;
    @Input() instance: InstanceEnvironment;

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