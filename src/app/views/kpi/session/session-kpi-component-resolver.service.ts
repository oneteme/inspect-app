import {Injectable, Type} from "@angular/core";
import {RestComponent} from "./rest/rest.component";
import {BatchComponent} from "./batch/batch.component";
import {StartupComponent} from "./startup/startup.component";

@Injectable({
  providedIn: 'root'
})
/**
 * Resolves session KPI section identifiers to Angular component classes.
 */
export class SessionKpiComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestComponent,
    'batch': BatchComponent,
    'startup': StartupComponent
  };

  /**
   * Returns the component class to render for a session KPI type.
   *
   * @param type Session KPI type key.
   * @returns Angular component type, or `undefined` if the key is unknown.
   */
  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}
