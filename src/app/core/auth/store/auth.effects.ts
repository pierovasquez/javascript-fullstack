import { Injectable } from '@angular/core';
import { Actions, ofType, Effect } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { AuthUser, User } from 'src/app/models/user.model';
import { LoginResponseData, AuthResponseData } from 'src/app/models/authResponse.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

const handleAuthentication = (resData: LoginResponseData | AuthResponseData) => {
  const expirationDate = new Date(new Date().getTime() + +resData.expiresIn * 1000);
  const loggedUser = new User(resData.email, resData.localId, resData.idToken, expirationDate, true);
  localStorage.setItem('userData', JSON.stringify(loggedUser));
  return new AuthActions.AuthenticateSuccess(loggedUser);
};

const handleError = (error) => {
  let errorMessage = 'An unknown error ocurred!';
  if (error.error && error.error.error) {
    switch (error.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct';
        break;
      default:
        break;
    }
  }
  return of(new AuthActions.AuthenticateFail(errorMessage));
};

// Injectable() solo es necesario porque en el constructor utilizamos HttpClient
@Injectable()
export class AuthEffects {
  // ofType => filtra el tipo de accion que quieres que pase
  // Este observable authLogin nunca debe morir. Es decir, si la request da un error y finaliza el observable, no volvera a recibir
  // acciones de tipo LOGIN_START por lo cual tenemos que asignar el catch error y retornar un observable no erroneo.
  // (NO throw error, etc... si no of())
  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((authData: AuthActions.LoginStart) => {
      const user: AuthUser = authData.payload;
      const updatedUser: AuthUser = {
        ...user,
        returnSecureToken: true
      };
      // tslint:disable-next-line: max-line-length
      return this.http.post<LoginResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`, updatedUser)
        .pipe(
          tap(resData => this.authService.setLogoutTimer(+resData.expiresIn * 1000)),
          map(resData => {
            // map() retorna un observable automaticamente. Si retornasemos un of() estariamos retornando un Observable dentro de otro
            return handleAuthentication(resData);
          }),
          catchError(error => {
            // Lo que tenemos que retornar dentro del of() es nuestra nueva accion sin necesidad de utilizar la funcion dispatch del store
            // ya que @Effect() se encargara de ello.
            return handleError(error);
          })
        );
    }),
  );

  @Effect()
  authSignUp = this.actions$.pipe(
    ofType(AuthActions.SIGN_UP_START),
    switchMap((signUpAction: AuthActions.SignUpStart) => {
      const user = signUpAction.payload;
      const updatedUser: AuthUser = {
        ...user,
        returnSecureToken: true
      };
      // tslint:disable-next-line: max-line-length
      return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`, updatedUser)
        .pipe(
          tap(resData => this.authService.setLogoutTimer(+resData.expiresIn * 1000)),
          map(resData => {
            // map() retorna un observable automaticamente. Si retornasemos un of() estariamos retornando un Observable dentro de otro
            return handleAuthentication(resData);
          }),
          catchError(error => {
            // Lo que tenemos que retornar dentro del of() es nuestra nueva accion sin necesidad de utilizar la funcion dispatch del store
            // ya que @Effect() se encargara de ello.
            return handleError(error);
          })
        );
    })
  );

  // Este Effect no lanza ningun dispatch como lo hace el anterior puesto que solo queremos que navegue hacia una cierta ruta
  // Para que no de errores e indiquemos que no dispondremos de ningun dispatch tenemos que rellenar el @Effect()
  @Effect({ dispatch: false })
  authRedirect = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS, AuthActions.LOGOUT),
    tap((authSuccessACtion: AuthActions.AuthenticateSuccess) => {
      if (authSuccessACtion.payload.redirect) {
        this.router.navigate(['/']);
      }
    })
  );

  @Effect()
  authAutoLogin = this.actions$.pipe(
    ofType(AuthActions.AUTO_LOGIN),
    map(() => {
      // TODO preguntar por que se tiene que guardar todo el objeto del usuario en el localStorage
      const userData: {
        email: string;
        id: string;
        _token: string;
        _tokenExpirationDate: string;
      } = JSON.parse(localStorage.getItem('userData'));
      if (!userData) {
        return { type: 'DUMMY' };
      }

      const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate), false);

      // Si el token sigue siendo valido, (la fecha del token no es mayor a la fecha actual), logeara el usuario.
      if (loadedUser.token) {
        const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
        this.authService.setLogoutTimer(expirationDuration);
        return new AuthActions.AuthenticateSuccess(loadedUser);
        // this.autoLogOut(expirationDuration);
      }
      return { type: 'DUMMY' };
    })
  );


  @Effect({ dispatch: false })
  authLogOut = this.actions$.pipe(
    ofType(AuthActions.LOGOUT),
    tap(() => {
      this.authService.clearLogoutTimer();
      localStorage.removeItem('userData');
      this.router.navigate(['/auth']);
    })
  );





  // Se utiliza $ para declarar que es un observable dentro de los Ngrx Effects
  // actions$ es un observable que se subscribe a los displatch del store de ngrx.
  // Generalmente querremos añadir acciones una vez nuestro store lance una accion asincrona (http request) y una
  // vez terminada la accion http, al estar suscritos a este dispatch, podremos lanzar una segunda accion
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }
}


