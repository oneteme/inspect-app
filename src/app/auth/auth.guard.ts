import {AuthService} from "./auth.service";
import {CanActivateFn} from "@angular/router";
import {inject} from "@angular/core";
import {auth} from "../../environments/environment";

export const authGuard: CanActivateFn = async () => {

    const authService = inject(AuthService);

    if (authService.isLogged() || !auth.enabled) {
        return true;
    }

    authService.login();
    return false;
};
