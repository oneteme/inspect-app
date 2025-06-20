import {Component, EventEmitter, Input, OnInit, Output, ViewChild, inject, OnDestroy} from "@angular/core";
import { FilterConstants, FilterPreset, FilterMap } from "src/app/views/constants";
import { AdvancedFilterComponent } from "../advanced-filter-modal/advanced-filter-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { FilterService } from "src/app/service/filter.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { Subscription } from "rxjs";



@Component({
    selector: 'advanced-filter-trigger',
    templateUrl: './advanced-filter-trigger.component.html',
    styleUrls: ['./advanced-filter-trigger.component.scss'],
    

})
export class AdvancedFilterTriggerComponent implements OnInit, OnDestroy {

    private _dialog = inject(MatDialog)
    private _filter = inject(FilterService);
    private filters: () => FilterMap;
    subscriptions: Subscription[] = [];
    currentPreset: string;
    presetsFilter: FilterPreset[];
    selectedPreset: FilterPreset;
    @ViewChild(MatMenuTrigger) ddTrigger: MatMenuTrigger;

    @Output() handleDialogclose = new EventEmitter<FilterMap>();
    @Output() handlePresetSelection = new EventEmitter<FilterPreset>();
    @Output() handlePresetSelectionReset = new EventEmitter<void>();
    @Output() handleFilterReset = new EventEmitter<void>();
    @Input() filterConfig: FilterConstants
    @Input() pageName: string;
    @Input() additionalFilter:FilterMap;
    @Input() set focusField(fieldName: string) {
        if (fieldName) {
            this.HandleOpenFilterDialog(fieldName);
        }
    }

    constructor() {

    }


    ngOnInit(): void {
        this.selectedPreset = null;
        this.presetsFilter = this._filter.getPresetsLocalStrorage(this.pageName); // of  ? 
    }


    HandleOpenFilterDialog(focusField?: string) {
        const dialog = this._dialog.open(AdvancedFilterComponent, {
            width: "70%",
            data: {
                filterConfig: this.filterConfig,
                focusField: focusField,
                pageName: this.pageName,
                additionalFilter: this.additionalFilter
            }
        })
        this.subscriptions.push(dialog.afterClosed().subscribe(result => {
            if (result) {
                this.handleDialogclose.emit(result);
            }
        }))
    }

     savePreset() {
         this.subscriptions.push(this._filter.savePreset(this.currentPreset, this.pageName).subscribe(val => {
                this.presetsFilter = this._filter.getPresetsLocalStrorage(this.pageName);
                this.selectedPreset = val;
                this.currentPreset= this.selectedPreset.name;
        }))
    }

    onPresetSelected(name: string) {
        const preset = this.presetsFilter.find(p => p.name === name);
        if (preset) {
            if(this.selectedPreset && preset.name == this.selectedPreset.name ){
                this.currentPreset = "";
                this.selectedPreset = null;
                this.handlePresetSelectionReset.emit();
            }else {
                this.selectedPreset = preset
                this.currentPreset= preset.name;
                this.handlePresetSelection.emit(structuredClone(preset));
            }
        }
    }

   removePreset(presetName:string) {
       const removedPreset = this._filter.removePreset(presetName,this.pageName);
        if(removedPreset){
            this.presetsFilter = this._filter.getPresetsLocalStrorage(this.pageName);
            if(this.presetsFilter.length == 0){
                this.ddTrigger.closeMenu();
            }        
            this.currentPreset = "";
            this.selectedPreset = null;
        }
    }

    resetFilters(){
        this.currentPreset = "";
        this.selectedPreset = null;
        this.handleFilterReset.emit();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }


}