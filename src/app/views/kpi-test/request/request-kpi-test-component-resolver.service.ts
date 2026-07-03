import {Injectable, Type} from "@angular/core";
import {RestKpiTestComponent} from "./rest/rest.component";

@Injectable({
  providedIn: 'root'
})
export class RequestKpiTestComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestKpiTestComponent,
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}
