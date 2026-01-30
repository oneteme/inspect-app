
import {
    AfterContentInit,
    AfterViewInit,
    Component,
    EventEmitter, inject,
    Inject,
    OnInit,
    Output,
    ViewChild
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {recreateDate} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";



@Component({
    templateUrl: './protocol-exception-modal.component.html',
    styleUrls: ['./protocol-exception-modal.component.scss'],


})
export class ProtocolExceptionComponent {

    @ViewChild("paginator", { static: true }) paginator: MatPaginator;
    @ViewChild("sort", { static: true }) sort: MatSort;
    @Output() onRowSelected = new EventEmitter<any>();
    private _router: EnvRouter = inject(EnvRouter);
    filterType = {
        "REST" : {
            uri: "/request/rest",
            'rangestatus': ['5xx','4xx','0xx']
        },
        "JDBC" : {
            uri: "/request/jdbc",
            rangestatus: 'Ko'
        },
        "FTP" : {
            uri: "/request/ftp",
            rangestatus: 'Ko'
        },
        "SMTP" : {
            uri: "/request/smtp",
            rangestatus: 'Ko'
        },
        "LDAP" : {
            uri: "/request/ldap",
            rangestatus: 'Ko'
        }
    }
    table: MatTableDataSource<{ stringDate: string, errorType: string, count: number }>
    protocolExceptionsDisplyedColumns: string[] = ["date", "err_type", "count"];

    constructor(public dialogRef: MatDialogRef<ProtocolExceptionComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
          
        setTimeout(() => {

            this.table = new MatTableDataSource(this.data.exceptions.observable.data)
            this.table.paginator = this.paginator;
            this.table.sort = this.sort;
        })

    }

    removePackage(errorType: string) {
        if (errorType!== null) {
            const index = errorType.toString().lastIndexOf('.');
            if(index>=0){
                return errorType?.substring(index +1);
            }
           return errorType
        }
        return 'N/A';
    }

    selectedRow(event: MouseEvent, row: any) {
        const redirectFn = this.data.type === 'REST' ? this.redirectRest : this.redirectOther;
        redirectFn.call(this, row);
    }

    redirectRest(row: any) {
        this.redirect(row, 'rangestatus');
    }

    redirectOther(row: any) {
        this.redirect(row, 'q');
    }

    private redirect(row: any, queryParamKey: string) {
        const result = recreateDate(this.data.groupedBy, row, this.data.start);
        if (result) {
            const { uri, ...queryParams } = this.filterType[this.data.type];
            this._router.navigate([uri], {
                queryParams: {
                    ...queryParams,
                    env: this.data.env,
                    start: result.start.toISOString(),
                    end: result.end.toISOString(),
                    [queryParamKey]: row.errorType
                }
            });
        }
    }
}