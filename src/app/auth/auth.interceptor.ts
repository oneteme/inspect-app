
import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { resolvedAuth } from './auth-code-flow.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {

        if (!resolvedAuth.enabled || !this.authService.isInitialized()) {
            return next.handle(req);
        }

        const token = this.authService.getToken();

        // not logged in OR no token (expired or deleted)
        if (!this.authService.isLogged() || !token) {

            // Initial navigation is handled by the auth guard.
            if (!this.router.navigated) {
                return EMPTY;
            }

            this.authService.login(this.router.url);
            return EMPTY;
        }

        return next.handle(
            req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            })
        );
    }
}
