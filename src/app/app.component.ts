import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subscription, distinctUntilChanged, filter, finalize, skip } from 'rxjs';
import { application, environment } from 'src/environments/environment';
import { EnvRouter } from './views/session-detail/session-detail.component';
import { MatDrawer } from '@angular/material/sidenav';
import { StatsService } from './shared/services/stats.service';
import { FilterService } from './shared/services/filter.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']

})

export class AppComponent implements OnInit {
  envs: any[];
  env: FormControl<string> = new FormControl();
  isLoadingEnv = false;
  subscriptions: Subscription[] = [];
  

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: EnvRouter,
    private _service: StatsService) {
    this.isLoadingEnv = true;
    this.subscriptions.push(this._service.getInstance({'column.distinct': 'environement', 'order': 'environement.asc'})
      .pipe(finalize(() => this.isLoadingEnv = false))
      .subscribe({
        next: (res: {environement: string}[]) => {
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
            queryParams: { env: res }
          });
        }
      }));

      this.subscriptions.push(this._activatedRoute.queryParams
      .subscribe({
        next: res => { // TODO  res.env always undefined 
          let r = this._activatedRoute.snapshot.queryParams['env'];
          if(!r){
            r = application.default_env;
          }
          if (this.env.value != r) {
            this.env.setValue(r, { emitEvent: false });
          }
        }
      }));
  }

  ngOnInit(): void {
    this.envs =  [application.default_env];
    if (!localStorage.getItem('server')) {
      localStorage.setItem('server', environment.url);
    }
  }

  ngAfterViewInit() {

  }

  ngOnDestroy(): void {
    this.unsubscribe();
}

  unsubscribe() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
