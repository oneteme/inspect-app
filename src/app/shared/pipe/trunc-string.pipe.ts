import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    name:"truncString"
})
export class TruncStringPipe implements PipeTransform {
    transform(value: string, length: number): any {
        if(value == null) return '';
        let val = value.substring(0, length);
        return val.length > length ? val + '...' : val;
    }
}