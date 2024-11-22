import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name:"size"
})

export class SizePipe implements PipeTransform {

    transform(value: any, ...args: any[]):string {
        if(!value) return '';
        if(value < 1024){
            return `${value} o`;
        }
        const units= ['ko','Mo' ];
        let size = value / 1024;
        let ui = 0;

        while( size>= 1024 && ui < units.length -1){
            size /= 1024;
            ui++;
        }

        return `${size.toFixed(2)} ${units[ui]}`;
    }
}