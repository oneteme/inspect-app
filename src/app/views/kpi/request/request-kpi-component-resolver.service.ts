import {Injectable, Type} from "@angular/core";
import {RestComponent} from "./rest/rest.component";
import {JdbcComponent} from "./jdbc/jdbc.component";
import {FtpComponent} from "./ftp/ftp.component";
import {LdapComponent} from "./ldap/ldap.component";
import {SmtpComponent} from "./smtp/smtp.component";

@Injectable({
  providedIn: 'root'
})
/**
 * Maps request KPI identifiers to their dedicated chart components.
 */
export class RequestKpiComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestComponent,
    'jdbc': JdbcComponent,
    'ftp': FtpComponent,
    'ldap': LdapComponent,
    'smtp': SmtpComponent
  };

  /**
   * Resolves the request KPI component for the provided protocol type.
   *
   * @param type Request protocol key.
   * @returns Angular component type, or `undefined` when no mapping exists.
   */
  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}