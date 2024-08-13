import { AfterContentChecked, AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { MatChipInputEvent } from "@angular/material/chips";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Filter, FilterMap, FilterPreset } from "src/app/views/constants";
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Subscription, catchError, finalize, of } from "rxjs";
import { JQueryService } from "src/app/service/jquery.service";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { FilterService } from "src/app/service/filter.service";

@Component({
    templateUrl: './advanced-filter-modal.component.html',
    styleUrls: ['./advanced-filter-modal.component.scss'],
    

})
export class AdvancedFilterComponent implements OnInit, AfterContentChecked, OnDestroy {

    private _fb = inject(FormBuilder);
    private _statsService = inject(JQueryService);
    private _ref = inject(ChangeDetectorRef);
    private _filter = inject(FilterService);

    @Input() isLoading: boolean;

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    form: FormGroup;
    subscriptions: Subscription[] = [];
    initialFormValues: any;
    presets: FilterPreset[];
    presetControl = new FormControl();
    selectedPreset: FilterPreset;
    isFormEmpty: boolean = false;
    cloneFilterValue: any = {}
    constructor(public dialogRef: MatDialogRef<AdvancedFilterComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { filterConfig: Filter[], focusField?: string, pageName: string }) { }


    ngOnInit(): void {
        this.cloneFilterValue = {}
        this.form = this.createGroup();
        this.isFormEmpty = this.checkIfFormEmpty()
    }

    ngAfterContentChecked() {
        this._ref.detectChanges();
        this.focusOnField(this.data.focusField);
    }

    createGroup() {
        const group = this._fb.group({});
        let control;
        this.subscriptions.push(this._filter.filters.subscribe(filter => {
            this.data.filterConfig.forEach(field => {
                this.cloneFilterValue = Object.assign({}, filter)
                const value = this.cloneFilterValue[field.key];

                control = this._fb.control(value)
                group.addControl(field.key, control)

                if (field.type != 'chip') {
                    this.subscriptions.push(control.valueChanges.subscribe(value => {
                        this.cloneFilterValue[field.key] = value
                        this.isFormEmpty = this.checkIfFormEmpty()
                    }))
                }

                if (field.query && !field.options) {
                    this.getSelectData(field);
                }
            });
        }));

        return group;
    }

    /* remove(index: number, fieldName:string){
         const options = this.form.controls[fieldName].value;
         if( index >= 0 ){
             options.splice(index,1);
             this.form.controls[fieldName].setValue(options)
         }
     }
 
     add(event: MatChipInputEvent, field:Filter){
         const value = event.value;
         if((value || '').trim()){
             console.log(field)
             console.log(this.form)
             const options = this.form.controls[field.key].value;
             options.push(value.trim());
             this.form.controls[field.key].setValue(options)
             
         }
 
         if(event.chipInput){
             event.chipInput.clear();
         }
     }*/

    resetForm() {
        this.form.reset();
        this.presetControl.reset();
        this.selectedPreset = null;
    }

    storeIntialFormValues() {
        this.initialFormValues = JSON.parse(JSON.stringify(this.form.value))
    }

    focusOnField(fieldName: string) {
        if (!fieldName)
            return;
        const field = document.getElementById(fieldName);
        if (field) {
            field.focus();
        }
    }



    getSelectData(field: Filter) {
        field.isLoading = true;
        this.subscriptions.push(this._statsService.getJqueryData(field.endpoint, field.query) // url 
            .pipe(finalize(() => { field.isLoading = false; }))
            .pipe(
                catchError(error => {
                    console.error('error',error)
                    return of(null)
                })
            )
            .subscribe({
                next: (result: any) => {
                    field.options = result
                }, error: e => console.log(e)
            }));
    }

    removeNullEntries(object: any) {
        return Object.entries(this.cloneFilterValue).reduce((accumulator: any, [key, value]: any) => {
            if ((value != null && value != '') || (Array.isArray(value) && value.length > 0)) {
                accumulator[key.toLowerCase()] = value;
            }
            return accumulator;
        }, {})
    }

    ngOnDestroy(): void {
        this.unsubscribe();
        this.cloneFilterValue = {};
    }

    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    checkIfFormEmpty() {
        let count = 0;
        Object.entries(this.form.controls).forEach(([key, value]: any) => {
            if (value.value == null || value.value == '' || (Array.isArray(value.value) && value.value.length == 0)) {
                count++;
            }
        });
        if (count == Object.keys(this.form.controls).length)
            return true;
        return false;
    }
}