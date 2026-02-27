import {Component, inject, OnDestroy} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, finalize, Subscription} from 'rxjs';
import {app, auth} from 'src/environments/environment';
import {EnvRouter} from "./service/router.service";
import {Constants} from "./views/constants";
import {InstanceService} from "./service/jquery/instance.service";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {OAuthService} from "angular-oauth2-oidc";
import {authCodeFlowConfig} from "./auth/auth-code-flow.config";


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _service: InstanceService = inject(InstanceService);
    private readonly _router: EnvRouter = inject(EnvRouter);

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
    envs: any[];
    env: FormControl<string> = new FormControl();
    isLoadingEnv = false;
    subscriptions: Subscription[] = [];


    constructor( private oauthService: OAuthService) {
        const iconRegistry = inject(MatIconRegistry);
        const sanitizer = inject(DomSanitizer);
        // Note that we provide the icon here as a string literal here due to a limitation in
        // Stackblitz. If you want to provide the icon from a URL, you can use:
        iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('./assets/github.svg'));
        this.envs = [app.defaultEnv];
        if (!localStorage.getItem('server')) {
            localStorage.setItem('server', app.host);
        }
        this.isLoadingEnv = true;
        this.subscriptions.push(this._service.getEnvironments()
            .pipe(finalize(() => this.isLoadingEnv = false))
            .subscribe({
                next: res => {
                    this.envs = res.map(r => r.environement);
                }
            }));
        this.subscriptions.push(this.env.valueChanges
            .pipe(
                distinctUntilChanged((previous: string, current: string) => {
                    return previous == current;
                }))
            .subscribe({
                next: res => {
                    this._router.navigate([], {
                        queryParamsHandling: 'merge',
                        queryParams: {env: res}
                    });
                }
            }));

        this.subscriptions.push(this._activatedRoute.queryParams
            .subscribe({
                next: res => {
                    let r = this._activatedRoute.snapshot.queryParams['env'];
                    if (!r) {
                        r = app.defaultEnv;
                    }
                    if (this.env.value != r) {
                        this.env.setValue(r, {emitEvent: false});
                    }
                }
            }));
    }



    ngOnDestroy(): void {
        this.unsubscribe();
    }

    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    gotoHome(event: MouseEvent){
        if (event.ctrlKey) {
            this._router.open(`#/home?env=${this.env.value}`, '_blank',)
        } else {
            this._router.navigate([`home`], {
                queryParams: { env: this.env.value }
            });
        }
    }
}
