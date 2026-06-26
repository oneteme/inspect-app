import {Injectable, Type} from "@angular/core";
import {RestComponent} from "./rest/rest.component";
import {BatchComponent} from "./batch/batch.component";
import {StartupComponent} from "./startup/startup.component";

@Injectable({
  providedIn: 'root'
})
export class SessionKpiComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestComponent,
    'batch': BatchComponent,
    'startup': StartupComponent
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}
