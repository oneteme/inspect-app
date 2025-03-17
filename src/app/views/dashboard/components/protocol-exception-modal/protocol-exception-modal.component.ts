
import { AfterContentInit, AfterViewInit, Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";



@Component({
    templateUrl: './protocol-exception-modal.component.html',
    styleUrls: ['./protocol-exception-modal.component.scss'],


})
export class ProtocolExceptionComponent {

    @ViewChild("paginator", { static: true }) paginator: MatPaginator;
    @ViewChild("sort", { static: true }) sort: MatSort;

    table: MatTableDataSource<{ date: string, errorType: string, count: number }>
    protocolExceptionsDisplyedColumns: string[] = ["date", "err_type", "count"];

    constructor(public dialogRef: MatDialogRef<ProtocolExceptionComponent>,
        @Inject(MAT_DIALOG_DATA) public exceptions: any) { 
          
        setTimeout(() => {
            this.table = new MatTableDataSource(this.exceptions.observable.data)
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
}