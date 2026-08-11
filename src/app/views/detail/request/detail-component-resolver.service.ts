import {Injectable, Type} from "@angular/core";
import {DetailFtpView} from "./ftp/detail-ftp.view";
import {DetailLdapView} from "./ldap/detail-ldap.view";
import {DetailDatabaseView} from "./database/detail-database.view";
import {DetailSmtpView} from "./smtp/detail-smtp.view";
import {DetailRestView} from "./rest/detail-rest.view";

@Injectable({
  providedIn: 'root'
})
/**
 * Maps request protocol identifiers to detail view components.
 */
export class DetailComponentResolverService {
  private componentMap: { [key: string]: Type<any> } = {
    'rest': DetailRestView,
    'jdbc': DetailDatabaseView,
    'ldap': DetailLdapView,
    'ftp': DetailFtpView,
    'smtp': DetailSmtpView
  };

  /**
   * Resolves the detail component to display for a protocol type.
   *
   * @param type Protocol key (rest, jdbc, ldap, ftp, smtp).
   * @returns Angular component type, or `undefined` for unknown keys.
   */
  resolveComponent(type: string): Type<any> {
    return this.componentMap[type];
  }
}