import {Injectable} from "@angular/core";
import {NavigationExtras, Router, UrlTree} from "@angular/router";
import {Observable} from "rxjs";

@Injectable()
/**
 * Wraps Angular Router to keep the selected environment in navigation query params.
 */
export class EnvRouter {

    private _env: string;

    constructor(private router: Router) { }

    /**
     * Updates the default environment propagated during navigation.
     *
     * @param env Environment code to inject in future routes.
     */
    set env(env: string) {
        this._env = env
    }

    /**
     * Exposes router navigation events.
     *
     * @returns Observable stream of Angular router events.
     */
    get events(): Observable<any> {
        return this.router.events;
    };

    /**
     * Returns the current router URL.
     *
     * @returns Current URL string.
     */
    get url(): string {
        return this.router.url;
    }

    /**
     * Provides direct access to the underlying Angular router instance.
     *
     * @returns Router instance used internally by this service.
     */
    get _router(): Router {
        return this.router;
    }

    /**
     * Navigates while automatically injecting/storing the `env` query parameter.
     *
     * @param commands Router commands defining the target route.
     * @param extras Optional navigation extras containing query parameters and options.
     * @returns A promise resolved with Angular navigation success status.
     */
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

    /**
     * Builds a URL tree while preserving the environment query parameter behavior.
     *
     * @param commands Router commands defining the target route.
     * @param extras Optional URL creation options.
     * @returns Computed Angular UrlTree.
     */
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

    /**
     * Opens an URL in a browser window/tab.
     *
     * @param url Optional URL to open.
     * @param target Optional browser target (`_blank`, `_self`, ...).
     * @param features Optional window features string.
     * @returns Browser window proxy or `null` when blocked.
     */
    open(url?: string | URL, target?: string, features?: string): WindowProxy | null {
        return window.open(url, target, features);
    }

    /**
     * Opens the destination in a new tab on Ctrl+Click, otherwise performs in-app navigation.
     *
     * @param event Mouse event used to detect Ctrl+Click.
     * @param commands Router commands defining the destination route.
     * @param extras Optional navigation extras.
     * @returns void after triggering open or navigate behavior.
     */
    navigateOnClick(event: MouseEvent, commands: any[], extras?: NavigationExtras) {
        if (event.ctrlKey) {
            let url = this.createUrlTree(commands, extras).toString();
            this.open(`#/${url}`, '_blank');
        } else {
            this.navigate(commands, extras);
        }
    }
}