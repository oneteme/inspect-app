import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    name:"exceptionType"
})
export class ExceptionTypePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if(value == null) return '';
        const index = value.lastIndexOf('.') + 1;
        return value.substring(index);
    }
}