import {Injectable, Type} from "@angular/core";
import {StatisticRequestJdbcComponent} from "./jdbc/statistic-request-jdbc.component";
import {StatisticRequestFtpComponent} from "./ftp/statistic-request-ftp.component";
import {StatisticRequestSmtpComponent} from "./smtp/statistic-request-smtp.component";
import {StatisticRequestLdapComponent} from "./ldap/statistic-request-ldap.component";
import {StatisticRequestHttpComponent} from "./http/statistic-request-http.component";

@Injectable({
  providedIn: 'root'
})
export class StatisticComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'jdbc': StatisticRequestJdbcComponent,
    'ftp':StatisticRequestFtpComponent,
    'smtp': StatisticRequestSmtpComponent,
    'ldap': StatisticRequestLdapComponent,
    'rest': StatisticRequestHttpComponent
  };

  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}