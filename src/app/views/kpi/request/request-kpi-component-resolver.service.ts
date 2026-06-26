import {Injectable, Type} from "@angular/core";
import {RestComponent} from "./rest/rest.component";
import {JdbcComponent} from "./jdbc/jdbc.component";
import {FtpComponent} from "./ftp/ftp.component";
import {LdapComponent} from "./ldap/ldap.component";
import {SmtpComponent} from "./smtp/smtp.component";

@Injectable({
  providedIn: 'root'
})
export class RequestKpiComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': RestComponent,
    'jdbc': JdbcComponent,
    'ftp': FtpComponent,
    'ldap': LdapComponent,
    'smtp': SmtpComponent
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}