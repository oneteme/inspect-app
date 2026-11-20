
import { CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { resolvedAuth } from './auth-code-flow.config';

export const authGuard: CanActivateChildFn = async (_route, state) => {
    if (!resolvedAuth.enabled) {
        return true;
    }

    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.init();

    if (!authService.isLogged()) {
        authService.login(state.url);
        return false;
    }
    
    if (authService.returnUrl) {
        const returnUrl = authService.returnUrl;
        authService.returnUrl = undefined;

        if (returnUrl !== state.url) {
            return router.parseUrl(returnUrl);
        }
    }

    return true;
};
