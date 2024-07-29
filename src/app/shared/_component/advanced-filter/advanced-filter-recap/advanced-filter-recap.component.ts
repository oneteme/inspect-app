import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FilterConstants } from "src/app/views/constants";


@Component({
    selector: 'advanced-filter-recap',
    templateUrl: './advanced-filter-recap.component.html',
    styleUrls: ['./advanced-filter-recap.component.scss'],
    
})
export class AdvancedFilterRecapComponent {

    advancedParams : Partial<{[key:string]:any}>

    @Output() filterRemoved = new EventEmitter<string>();
    @Output() focusField = new EventEmitter<string>();

    @Input() set filters(object: Partial<{[key:string]:any}>) {
        if (object) {
            this.advancedParams = object;
        } 
    }

    remove(filterName:string){
        if(filterName){
            this.filterRemoved.emit(filterName);
        }
    }

    openFilterDialog(fieldName: string){
        this.focusField.emit(fieldName);
    }
   
}