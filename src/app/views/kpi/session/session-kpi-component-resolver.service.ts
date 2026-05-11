import {Injectable, Type} from "@angular/core";
import {RestComponent} from "./rest/rest.component";
import {BatchComponent} from "./batch/batch.component";

@Injectable({
  providedIn: 'root'
})
export class SessionKpiComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestComponent,
    'batch': BatchComponent
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}