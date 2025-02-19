import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {inject} from "@angular/core";
import {MatSnackBar} from "@angular/material/snack-bar";

export class Interceptor implements  HttpInterceptor {
    private readonly _snackBar = inject(MatSnackBar);
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req)
            .pipe(
                catchError((error:HttpErrorResponse) => {
                    if(error.status === 404){
                        return throwError(()=>error)
                    }
                    this._snackBar.open(error.error && error.status ? error.error.message : error.message, "Fermer",
                        {
                            horizontalPosition: "center",
                            verticalPosition: "top",
                            duration: 5000
                        });

                    return throwError(()=>error)
                }
              )
            )
    }

}