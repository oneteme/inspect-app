import {Component, inject, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DecimalPipe} from "@angular/common";
import {recreateDate} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";

@Component({
    templateUrl: './protocol-exception-modal.component.html',
    styleUrls: ['./protocol-exception-modal.component.scss'],
    providers: [DecimalPipe]
})
export class ProtocolExceptionComponent {

    private _router: EnvRouter = inject(EnvRouter);

    errorStatus = {
        "ServerError": "5xx",
        "ClientError": "4xx",
    };

    filterType = {
        "REST":  { uri: "/request/rest",  rangestatus: ['5xx', '4xx', '0xx'] },
        "JDBC":  { uri: "/request/jdbc",  rangestatus: 'Ko' },
        "FTP":   { uri: "/request/ftp",   rangestatus: 'Ko' },
        "SMTP":  { uri: "/request/smtp",  rangestatus: 'Ko' },
        "LDAP":  { uri: "/request/ldap",  rangestatus: 'Ko' }
    };

    exceptions: { stringDate: string; errorType: string; count: number; countok: number }[] = [];

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
        this.exceptions = (this.data.exceptions.observable.data || [])
            .filter((e: any) => e.count > 0);
    }

    selectedRow(event: MouseEvent, row: any) {
        const redirectFn = this.data.type === 'REST' ? this.redirectRest : this.redirectOther;
        redirectFn.call(this, row);
    }

    redirectRest(row: any) {
        this.redirect(row, {
            rangestatus: this.errorStatus[row.errorType] || '0xx',
            ...(!this.errorStatus[row.errorType] && { q: row.errorType })
        });
    }

    redirectOther(row: any) {
        this.redirect(row, { q: row.errorType });
    }

    private redirect(row: any, params: { [key: string]: any }) {
        const result = recreateDate(this.data.groupedBy, row, this.data.start);
        if (result) {
            const { uri, ...queryParams } = this.filterType[this.data.type];
            this._router.navigate([uri], {
                queryParams: {
                    ...queryParams,
                    env: this.data.env,
                    start: result.start.toISOString(),
                    end: result.end.toISOString(),
                    ...params
                }
            });
        }
    }
}