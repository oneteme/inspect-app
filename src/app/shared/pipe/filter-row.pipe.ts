import { Pipe, PipeTransform } from "@angular/core";
import { Filter } from "src/app/views/constants";
import { groupingBy } from "../util";

@Pipe({
    name: 'groupByRow'
})
export class FilterRowPipe implements PipeTransform {
    transform(value: Filter[], ...args: any[]): { row: string, filters: Filter[] }[] {
        let groupingByRow: { [key: number]: Filter[] } = groupingBy(value, 'row');
        return Object.entries(groupingByRow).map(obj => ({ row: obj[0], filters: obj[1] }));
    }
}