import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {map, Observable, startWith} from "rxjs";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";

@Component({
  selector: 'autocomplete-chip',
  templateUrl: './autocomplete-chip.component.html',
  styleUrls: ['./autocomplete-chip.component.scss']
})
export class AutocompleteChipComponent implements OnChanges {
  formCtrl = new FormControl('');
  filtered: Observable<string[]>;

  _selected: string[] = [];
  _values: string[] = [];

  @ViewChild('input') nameInput: ElementRef<HTMLInputElement>;

  @Input() label: string;
  @Input() set values(values: string[]) {
    if(values) {
      this._values = [...values];
      this.filtered = this.formCtrl.valueChanges.pipe(
        startWith(null),
        map((f: string | null) => (f ? this._filter(f) : this._values.slice())),
      );
    }
  }

  @Input() set selected(values: string[]) {
    if(values) {
      this._selected = values;
    }
  }

  @Output() selectedChange = new EventEmitter();

  ngOnChanges(changes: SimpleChanges) {
    if(changes['selected'] || changes['values']) {
      if(this._values.length && this._selected.length) {
        this._values = this._values.filter(v => !this._selected.includes(v))
      }
    }
  }

  onRemove(s: string): void {
    this._values.push(s);
    this._values.sort((a, b) => a.localeCompare(b));
    this.nameInput.nativeElement.value = '';
    this.formCtrl.setValue('');
    const index = this._selected.findIndex(se => se === s);
    if (index >= 0) {
      this._selected.splice(index, 1);
    }
    this.selectedChange.emit(this._selected);
  }

  onSelect(event: MatAutocompleteSelectedEvent): void {
    const index = this._values.findIndex(v => v === event.option.value);
    if (index >= 0) {
      this._values.splice(index, 1)
    }
    this._selected.push(event.option.value);
    this.selectedChange.emit(this._selected);
    this.nameInput.nativeElement.value = '';
    this.formCtrl.setValue('');
  }

  private _filter(name: string): string[] {
    let filterValue = name.toLowerCase();
    return this._values.filter(v => v.toLowerCase().includes(filterValue));
  }
}
