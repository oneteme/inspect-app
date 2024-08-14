import {Component, inject, Input, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceMainSession, InstanceRestSession} from "../../../../model/trace.model";
import {EnvRouter} from "../../../../service/router.service";

@Component({
    selector: 'detail-session',
    templateUrl: './detail-session.component.html',
    styleUrls: ['./detail-session.component.scss']
})
export class DetailSessionComponent {
    private _router: EnvRouter = inject(EnvRouter);

    @Input() session: InstanceMainSession | InstanceRestSession;
    @Input() instance: InstanceEnvironment;

    selectedRequest(event: { event: MouseEvent, row: any }) {
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session', 'rest', event.row], { queryParams: { env: this.instance.env } }); // TODO remove env FIX BUG
            }
        }
    }

    selectedFtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            let segment = 'rest';
            if(this.session.type) segment = `main/${this.session.type.toLowerCase()}`;
            if (event.event.ctrlKey) {
                this._router.open(`#/session/${segment}/${this.session.id}/ftp/${event.row}`, '_blank',)
            } else {
                this._router.navigate([`/session/${segment}`, this.session.id, 'ftp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedLdap(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            let segment = 'rest';
            if(this.session.type) segment = `main/${this.session.type.toLowerCase()}`;
            if (event.event.ctrlKey) {
                this._router.open(`#/session/${segment}/${this.session.id}/ldap/${event.row}`, '_blank',)
            } else {
                this._router.navigate([`/session/${segment}`, this.session.id, 'ldap', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedSmtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            let segment = 'rest';
            if(this.session.type) segment = `main/${this.session.type.toLowerCase()}`;
            if (event.event.ctrlKey) {
                this._router.open(`#/session/${segment}/${this.session.id}/smtp/${event.row}`, '_blank',)
            } else {
                this._router.navigate([`/session/${segment}`, this.session.id, 'smtp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            let segment = 'rest';
            if(this.session.type) segment = `main/${this.session.type.toLowerCase()}`;
            if (event.event.ctrlKey) {
                this._router.open(`#/session/${segment}/${this.session.id}/database/${event.row}`, '_blank',)
            } else {
                this._router.navigate([`/session/${segment}`, this.session.id, 'database', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }
}