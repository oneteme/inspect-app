import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    name:"titleCase"
})
export class TitleCasePipe implements PipeTransform {
    transform(value: any): any {
        if (!value) return value;
        return value[0].toUpperCase() + value.substring(1).toLowerCase();
    }
}