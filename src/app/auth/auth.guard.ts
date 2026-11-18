import { AuthService } from "./auth.service";
import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { resolvedAuth } from "./auth-code-flow.config";

export const authGuard: CanActivateFn = async (route, state) => {
    if (resolvedAuth.enabled) {
        const authService = inject(AuthService);

        if (!authService.isInitialized()) {
            return false;
        }

        if (authService.isLogged()) {
            return true;
        }

        authService.login(state.url);
        return false;
    }

    return true;
};