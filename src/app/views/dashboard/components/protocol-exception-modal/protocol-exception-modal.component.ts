
import { AfterContentInit, AfterViewInit, Component, Inject, OnInit, ViewChild} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";



@Component({
    templateUrl: './protocol-exception-modal.component.html',
    styleUrls: ['./protocol-exception-modal.component.scss'],
    

})
export class ProtocolExceptionComponent implements OnInit, AfterViewInit {

    @ViewChild("paginator") paginator: MatPaginator;
    @ViewChild("sort") sort: MatSort;
    table :any;
    protocolExceptionsDisplyedColumns: string[] = ["date","errType","count"];
    constructor(public dialogRef: MatDialogRef<ProtocolExceptionComponent>,
        @Inject(MAT_DIALOG_DATA) public exceptions: any) { }

    ngAfterViewInit(): void {

        setTimeout(() => { // TODO: fix sort pagination 
          // this.exceptions.observable.data.paginator = this.paginator;
           // this.exceptions.observable.data.sort = this.sort;
        }, 0);
    }

    ngOnInit(): void {
    }

    removePackage(errorType: string ){
        if(errorType){
            const index = errorType.lastIndexOf('.') + 1;
            return errorType?.substring(index) ;
        }
        return 'N/A';
    }
}