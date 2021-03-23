import {Injectable} from '@angular/core'
import {HttpClient} from '@angular/common/http'
import {environment} from '../environments/environment'
import {Userdata} from './userdata'
import {Observable, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private _http: HttpClient) {
    }

    /**
     * Login
     * @param username 
     * @param password 
     * @returns 
     */
    login(username, password): Observable<Object | Userdata> {
        let url = environment.apiUrl + '/login'
        const data = {
            user: username,
            pw: password
        }
        return this._http.post(url, data).pipe(
            catchError(this.handleError<Userdata>('login'))
        )
    }

    /**
     * Registers a user
     * @param username 
     * @param password 
     * @returns 
     */
    register(username, password): Observable<Object | any> {
        let url = environment.apiUrl + '/register'
        const data = {
            user: username,
            pw: password
        }
        return this._http.post(url, data).pipe(
            catchError(this.handleError<Userdata>('register'))
        )
    }

    /**
     * handles and logs errors
     *
     * @param operation
     * @param result
     * @private
     */
     private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(operation, error)
            return of(result as T)
        }
    }
}