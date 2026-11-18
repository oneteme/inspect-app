import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
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
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {

        if (!resolvedAuth.enabled) {
            return next.handle(req);
        }

        // Do not interfere with OAuth initialization requests
        if (!this.authService.isInitialized()) {
            return next.handle(req);
        }

        // token expiré ou supprimé
        if (!this.authService.isLogged()) {
            this.authService.login(this.router.url);
            return EMPTY;
        }

        const accessToken = this.authService.getAccessToken();

        if (!accessToken) {
            this.authService.login(this.router.url);
            return EMPTY;
        }

        return next.handle(req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        }));
    }
}
