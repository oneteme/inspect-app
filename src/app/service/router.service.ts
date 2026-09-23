import {Injectable} from "@angular/core";
import {NavigationExtras, Router, UrlTree} from "@angular/router";
import {Observable} from "rxjs";

@Injectable()
export class EnvRouter {

    private _namespace: string;

    constructor(private router: Router) { }

    set namespace(namespace: string) {
        this._namespace = namespace
    }

    get events(): Observable<any> {
        return this.router.events;
    };

    get url(): string {
        return this.router.url;
    }

    get _router(): Router {
        return this.router;
    }

    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (!extras?.queryParams?.env) {
            if (this._namespace) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.namespace = this._namespace;
            }
        }
        else {
            this.namespace = extras.queryParams.namespace;
        }
        return this.router.navigate(commands, extras);
        // return Promise.resolve(true);
    }

    createUrlTree(commands: any[], extras?: NavigationExtras): UrlTree {
        if (!extras?.queryParams?.namespace) {
            if (this._namespace) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.namespace = this._namespace;
            }
        }
        else {
            this.namespace = extras.queryParams.namespace;
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
