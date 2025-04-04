import {Component, Input, ViewChild} from "@angular/core";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'server-start-table',
  templateUrl: './server-start-table.component.html',
  styleUrls: ['./server-start-table.component.scss'],
})
export class ServerStartTableComponent {
  displayedColumns: string[] = ['appName', 'version', 'duree'];
  dataSource: MatTableDataSource<{ appName: string, version: string, start:number }> = new MatTableDataSource([]);
  today: Date = new Date();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

  @Input() set data(objects: any[]) {
    if (objects?.length) {
      this.dataSource = new MatTableDataSource(objects);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sortData = (data: { appName: string, version: string, start:number }[], sort: MatSort) => {
        return data.sort((a, b) => {
          switch (sort.active) {
            case 'duree': return compare(a.start, b.start, sort.direction === 'desc');
            case 'appName': return compare(a.appName, b.appName, sort.direction === 'asc');
            case 'version': return compare(a.version, b.version, sort.direction === 'asc');
            default: return 0;
          }
        })
      }
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  @Input() isLoading: boolean;

}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}