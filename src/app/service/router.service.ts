import {Injectable} from "@angular/core";
import {NavigationExtras, Router, UrlTree} from "@angular/router";
import {Observable} from "rxjs";

@Injectable()
export class EnvRouter {

    private _env: string;

    constructor(private router: Router) { }

    set env(env: string) {
        this._env = env
    }

    get events(): Observable<any> {
        return this.router.events;
    };

    get url(): string {
        return this.router.url;
    }


    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (!extras?.queryParams?.env) {
            if (this._env) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.env = this._env;
            }
        }
        else {
            this.env = extras.queryParams.env;
        }
        return this.router.navigate(commands, extras);
        // return Promise.resolve(true);
    }

    createUrlTree(commands: any[], extras?: NavigationExtras): UrlTree {
        if (!extras?.queryParams?.env) {
            if (this._env) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.env = this._env;
            }
        }
        else {
            this.env = extras.queryParams.env;
        }
        return this.router.createUrlTree(commands, extras);
    }

    open(url?: string | URL, target?: string, features?: string): WindowProxy | null {
        return window.open(url, target, features);
    }

    navigateOnClick(event: MouseEvent, commands: any[], extras?: NavigationExtras) {
        if (event.ctrlKey) {
            let url = this.createUrlTree(commands, extras).toString();
            this.open(`#/${url}`, '_blank');
        } else {
            this.navigate(commands, extras);
        }
    }
}