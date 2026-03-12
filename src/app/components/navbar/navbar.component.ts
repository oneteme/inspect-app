import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, finalize, Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { app } from 'src/environments/environment';
import { Constants } from '../../views/constants';
import { EnvRouter } from '../../service/router.service';
import { InstanceService } from '../../service/jquery/instance.service';

interface SubNavItem {
  label: string;
  icon: string;
  id: string;
  route: string;
}

interface NavItem {
  label: string;
  icon: string;
  id: string;
  route?: string;
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

  MAPPING_TYPE = Constants.MAPPING_TYPE;

  envs: string[] = [];
  env: FormControl<string> = new FormControl();
  isLoadingEnv = false;
  subscriptions: Subscription[] = [];

  readonly navItems: NavItem[] = [
    {
      label: Constants.MAPPING_TYPE['request'].title,
      icon: Constants.MAPPING_TYPE['request'].icon,
      id: 'request',
      children: [
        { label: Constants.REQUEST_MAPPING_TYPE['rest'].title, icon: Constants.REQUEST_MAPPING_TYPE['rest'].icon, id: 'rest', route: 'request/rest' },
        { label: Constants.REQUEST_MAPPING_TYPE['jdbc'].title, icon: Constants.REQUEST_MAPPING_TYPE['jdbc'].icon, id: 'jdbc', route: 'request/jdbc' },
        { label: Constants.REQUEST_MAPPING_TYPE['ftp'].title, icon: Constants.REQUEST_MAPPING_TYPE['ftp'].icon, id: 'ftp', route: 'request/ftp' },
        { label: Constants.REQUEST_MAPPING_TYPE['smtp'].title, icon: Constants.REQUEST_MAPPING_TYPE['smtp'].icon, id: 'smtp', route: 'request/smtp' },
        { label: Constants.REQUEST_MAPPING_TYPE['ldap'].title, icon: Constants.REQUEST_MAPPING_TYPE['ldap'].icon, id: 'ldap', route: 'request/ldap' },
      ]
    },
    { label: Constants.MAPPING_TYPE['rest'].title, icon: Constants.MAPPING_TYPE['rest'].icon, id: 'rest', route: 'session/rest' },
    { label: Constants.MAPPING_TYPE['batch'].title, icon: Constants.MAPPING_TYPE['batch'].icon, id: 'batch', route: 'session/batch' },
    { label: Constants.MAPPING_TYPE['test'].title, icon: Constants.MAPPING_TYPE['test'].icon, id: 'test', route: 'session/test' },
    { label: Constants.MAPPING_TYPE['startup'].title, icon: Constants.MAPPING_TYPE['startup'].icon, id: 'startup', route: 'session/startup' },
    { label: Constants.MAPPING_TYPE['view'].title, icon: Constants.MAPPING_TYPE['view'].icon, id: 'view', route: 'session/view' },
  ];

  constructor() {
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

  gotoHome() {
    this._envRouter.navigate(['home'], { queryParams: { env: this.env.value } });
  }

  gotoDeploiment() {
    this._envRouter.navigate(['deploiment'], { queryParams: { env: this.env.value } });
  }

  gotoDeploimentV2() {
    this._envRouter.navigate(['deploiment_v2'], { queryParams: { env: this.env.value } });
  }

  selectEnv(value: string) {
    this.env.setValue(value);
  }

  navigateTo(route: string) {
    this._envRouter.navigate([route], { queryParams: { env: this.env.value } });
  }

  navigateToSub(_parent: NavItem, child: SubNavItem) {
    this._envRouter.navigate([child.route], { queryParams: { env: this.env.value } });
  }

  getEnvClass(env: string): string {
    const known = ['dev', 'ppd', 'prv', 'rec', 'pg', 'rcc'];
    return known.includes(env) ? env : 'other';
  }

}
