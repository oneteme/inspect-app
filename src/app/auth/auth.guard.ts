import { AuthService } from "./auth.service";
import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { auth } from "../../environments/environment";

export const authGuard: CanActivateFn = async () => {
    // true => user is logged and page is not blocked by authentication
    if (auth.enabled) {
        const authService = inject(AuthService);
        if (!authService.isInitialized()) return false;
        
        if (authService.isLogged()) {
            return true;
        } else {
            authService.login(); // Redirect to login page
            return false;
        }
    }
    return true;
};


