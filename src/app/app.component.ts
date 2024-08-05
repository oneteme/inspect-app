import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, finalize, Subscription} from 'rxjs';
import {application, environment} from 'src/environments/environment';
import {JQueryService} from './service/jquery.service';
import {EnvRouter} from "./service/router.service";
import {Constants} from "./views/constants";


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _service: JQueryService = inject(JQueryService);
    private _router: EnvRouter = inject(EnvRouter);

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    envs: any[];
    env: FormControl<string> = new FormControl();
    isLoadingEnv = false;
    subscriptions: Subscription[] = [];


    constructor() {
        this.isLoadingEnv = true;
        this.subscriptions.push(this._service.getInstance({
            'column.distinct': 'environement',
            'environement.not': 'null',
            'order': 'environement.asc'
        })
            .pipe(finalize(() => this.isLoadingEnv = false))
            .subscribe({
                next: (res: { environement: string }[]) => {
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
                next: res => { // TODO  res.env always undefined
                    let r = this._activatedRoute.snapshot.queryParams['env'];
                    if (!r) {
                        r = application.default_env;
                    }
                    if (this.env.value != r) {
                        this.env.setValue(r, {emitEvent: false});
                    }
                }
            }));
    }

    ngOnInit(): void {
        this.envs = [application.default_env];
        if (!localStorage.getItem('server')) {
            localStorage.setItem('server', environment.url);
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe();
    }

    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
