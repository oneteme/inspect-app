import { AuthService } from "./auth.service";
import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { auth } from "../../environments/environment";

export const authGuard: CanActivateFn = async () => {
    if (auth.enabled) {
        const authService = inject(AuthService);
        if (authService.initialized && authService.isLogged()) {
            console.log(authService.getUserProfile());
            return true;
        } else {
            authService.login();
            return false;
        }
    }
    return true;
};

