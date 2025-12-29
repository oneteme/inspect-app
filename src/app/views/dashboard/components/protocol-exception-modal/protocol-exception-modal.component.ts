
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
            rangestatus: 'true'
        },
        "FTP" : {
            uri: "/request/ftp",
            rangestatus: 'true'
        },
        "SMTP" : {
            uri: "/request/smtp",
            rangestatus: 'true'
        },
        "LDAP" : {
            uri: "/request/ldap",
            rangestatus: 'true'
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
        if (errorType) {
            const index = errorType.lastIndexOf('.') + 1;
            return errorType?.substring(index);
        }
        return 'N/A';
    }

    selectedRow(event: MouseEvent, row: any) {
        const result = recreateDate(this.data.groupedBy, row, this.data.start);
        if(result){
            let uri  = this.filterType[this.data.type].uri;
            delete this.filterType[this.data.type].uri;
            this._router.navigate([uri], {
                queryParams: Object.assign({
                    'env': this.data.env,
                    'start': result.start.toISOString(),
                    'end': result.end.toISOString(),
                    'q' : row.errorType
                },this.filterType[this.data.type])
            });
        }
    }
}