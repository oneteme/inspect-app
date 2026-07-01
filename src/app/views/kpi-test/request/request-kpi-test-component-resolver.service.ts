import {Injectable, Type} from "@angular/core";
import {RestKpiTestComponent} from "./rest/rest.component";
import {JdbcComponent} from "../../kpi/request/jdbc/jdbc.component";
import {FtpComponent} from "../../kpi/request/ftp/ftp.component";
import {LdapComponent} from "../../kpi/request/ldap/ldap.component";
import {SmtpComponent} from "../../kpi/request/smtp/smtp.component";

@Injectable({
  providedIn: 'root'
})
export class RequestKpiTestComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestKpiTestComponent,
    'jdbc': JdbcComponent,
    'ftp': FtpComponent,
    'ldap': LdapComponent,
    'smtp': SmtpComponent
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}
