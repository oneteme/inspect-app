import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, finalize, Subscription} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import {MatMenuTrigger} from '@angular/material/menu';
import {app, auth} from 'src/environments/environment';
import {Constants} from '../../views/constants';
import {EnvRouter} from '../../service/router.service';
import {InstanceService} from '../../service/jquery/instance.service';
import {AuthService} from "../../auth/auth.service";

interface SubNavItem {
  label: string;
  icon: string;
  id: string;
  route: string;
  kpiRoute?: string;
}

interface NavItem {
  label: string;
  icon: string;
  id: string;
  route?: string;
  kpiRoute?: string;
  children?: SubNavItem[];
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _service = inject(InstanceService);
  private readonly _envRouter = inject(EnvRouter);

  @ViewChild('mainTrigger') mainMenuTrigger: MatMenuTrigger;

  MAPPING_TYPE = Constants.MAPPING_TYPE;

  envs: string[] = [];
  env: FormControl<string> = new FormControl();
  isLoadingEnv = false;
  subscriptions: Subscription[] = [];
  authEnabled = auth.enabled;

  readonly navItems: NavItem[] = [
    {
      label: Constants.MAPPING_TYPE['request'].title,
      icon: Constants.MAPPING_TYPE['request'].icon,
      id: 'request',
      children: [
        { label: Constants.REQUEST_MAPPING_TYPE['rest'].title, icon: Constants.REQUEST_MAPPING_TYPE['rest'].icon, id: 'rest', route: 'request/rest', kpiRoute: 'kpi/request/rest' },
        { label: Constants.REQUEST_MAPPING_TYPE['jdbc'].title, icon: Constants.REQUEST_MAPPING_TYPE['jdbc'].icon, id: 'jdbc', route: 'request/jdbc', kpiRoute: 'kpi/request/jdbc' },
        { label: Constants.REQUEST_MAPPING_TYPE['ftp'].title, icon: Constants.REQUEST_MAPPING_TYPE['ftp'].icon, id: 'ftp', route: 'request/ftp', kpiRoute: 'kpi/request/ftp' },
        { label: Constants.REQUEST_MAPPING_TYPE['smtp'].title, icon: Constants.REQUEST_MAPPING_TYPE['smtp'].icon, id: 'smtp', route: 'request/smtp', kpiRoute: 'kpi/request/smtp' },
        { label: Constants.REQUEST_MAPPING_TYPE['ldap'].title, icon: Constants.REQUEST_MAPPING_TYPE['ldap'].icon, id: 'ldap', route: 'request/ldap', kpiRoute: 'kpi/request/ldap' },
      ]
    },
    { label: Constants.MAPPING_TYPE['rest'].title, icon: Constants.MAPPING_TYPE['rest'].icon, id: 'rest', route: 'session/rest', kpiRoute: 'kpi/session/rest' },
    { label: Constants.MAPPING_TYPE['batch'].title, icon: Constants.MAPPING_TYPE['batch'].icon, id: 'batch', route: 'session/batch', kpiRoute: 'kpi/session/batch' },
    { label: Constants.MAPPING_TYPE['test'].title, icon: Constants.MAPPING_TYPE['test'].icon, id: 'test', route: 'session/test' },
    { label: Constants.MAPPING_TYPE['startup'].title, icon: Constants.MAPPING_TYPE['startup'].icon, id: 'startup', route: 'session/startup' },
    { label: Constants.MAPPING_TYPE['view'].title, icon: Constants.MAPPING_TYPE['view'].icon, id: 'view', route: 'session/view' },
  ];

  constructor(private authService: AuthService) {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('./assets/github.svg'));
  }

  ngOnInit() {
    this.envs = [app.defaultEnv];
    if (!localStorage.getItem('server')) {
      localStorage.setItem('server', app.host);
    }
    this.isLoadingEnv = true;
    this.subscriptions.push(
      this._service.getEnvironments()
        .pipe(finalize(() => (this.isLoadingEnv = false)))
        .subscribe({ next: res => { this.envs = res.map(r => r.environement); } })
    );
    this.subscriptions.push(
      this.env.valueChanges
        .pipe(distinctUntilChanged((prev, curr) => prev === curr))
        .subscribe({
          next: value => {
            this._envRouter.navigate([], {
              queryParamsHandling: 'merge',
              queryParams: { env: value }
            });
          }
        })
    );
    this.subscriptions.push(
      this._activatedRoute.queryParams.subscribe({
        next: () => {
          const envParam = this._activatedRoute.snapshot.queryParams['env'] || app.defaultEnv;
          if (this.env.value !== envParam) {
            this.env.setValue(envParam, { emitEvent: false });
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  gotoHome(event: MouseEvent) {
    this._envRouter.navigateOnClick(event, ['home'], { queryParams: { env: this.env.value } });
  }

  gotoDeploiment(event: MouseEvent) {
    this._envRouter.navigateOnClick(event, ['deploiment'], { queryParams: { env: this.env.value } });
  }

  selectEnv(value: string) {
    this.env.setValue(value);
  }

  navigateTo(event: MouseEvent, route: string) {
    this._envRouter.navigateOnClick(event, [route], { queryParams: { env: this.env.value } });
  }

  navigateToSub(event: MouseEvent, _parent: NavItem, child: SubNavItem) {
    this._envRouter.navigateOnClick(event, [child.route], { queryParams: { env: this.env.value } });
  }

  navigateToKpi(event: MouseEvent, kpiRoute: string) {
    this.mainMenuTrigger?.closeMenu();
    this._envRouter.navigateOnClick(event, [kpiRoute], { queryParams: { env: this.env.value } });
  }

  getEnvClass(env: string): string {
    const known = ['dev', 'ppd', 'prv', 'rec', 'pg', 'rcc'];
    return known.includes(env) ? env : 'other';
  }

  getUserClaims(): any {
    return this.authService.getUserProfile() || {};
  }

  getUserInitials(): string {
    const claims = this.getUserClaims();
    const name: string = claims?.name || claims?.email || '';
    if (!name) return '?';
    const parts = name.split(/[\s.@_-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  getUserDisplayName(): string {
    const claims = this.getUserClaims();
    return claims?.name || claims?.preferred_username || claims?.email || 'Utilisateur';
  }

  getUserEmail(): string {
    const claims = this.getUserClaims();
    return claims?.email || '';
  }

  logout() {
    this.authService.logout();
  }

}
