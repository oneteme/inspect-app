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
    const component = this.componentMap[type];
    if (!component) {
      throw new Error(`Unsupported KPI test request type: ${type}`);
    }
    return component;
  }
}
