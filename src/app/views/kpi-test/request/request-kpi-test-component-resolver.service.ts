import {Injectable, Type} from "@angular/core";
import {RestKpiTestComponent} from "./rest/rest.component";

@Injectable({
  providedIn: 'root'
})
/**
 * Resolves request KPI test component types to their concrete Angular components.
 */
export class RequestKpiTestComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestKpiTestComponent,
  };

  /**
   * Returns the component class associated with a KPI test request type.
   *
   * @param type Request type key (for example `rest`).
   * @returns Angular component type matching the provided key.
   * @throws Error when the request type is not supported.
   */
  resolveComponent(type: string): Type<any> {
    const component = this.componentMap[type];
    if (!component) {
      throw new Error(`Unsupported KPI test request type: ${type}`);
    }
    return component;
  }
}
