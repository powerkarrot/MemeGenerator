import {Injectable} from '@angular/core'
import {Observable, of} from 'rxjs'
import {Meme} from './meme'
import {HttpClient} from '@angular/common/http'
import {catchError} from 'rxjs/operators'
import {environment} from '../environments/environment'

@Injectable({
    providedIn: 'root'
})
export class MemeService {

    constructor(private _http: HttpClient) {
    }

    /**
     * updates meme
     *
     * @param id
     * @param data
     */
    updateMeme(id, data): Observable<Object | Meme> {
        let url = environment.apiUrl + '/meme'
        if (id !== null) url += '/' + id
        return this._http.post(url, data).pipe(
            catchError(this.handleError<Meme>('updateMeme'))
        )
    }

    voteMeme(id: number, isUpvote : boolean): Observable<any> {
        if (id !== null) {
            let url = environment.apiUrl + '/meme/vote/' + id
            const vote = isUpvote ? 1 : -1
            const data = {
                "vote": vote
            }
            return this._http.post(url, data).pipe(
                catchError(this.handleError<any>('voteMeme'))
            )
        }
    }

    /**
     * deletes meme
     *
     * @param id
     */
    deleteMeme(id): Observable<any> {
        let url = environment.apiUrl + '/meme/' + id
        return this._http.delete(url).pipe(
            catchError(this.handleError<any>('deleteMeme'))
        )
    }

    /**
     * reads meme by id
     *
     * @param id
     */
    getMeme(id): Observable<Object | Meme> {
        let url = environment.apiUrl + '/meme/' + id
        return this._http.get(url).pipe(
            catchError(this.handleError<Meme>('getMeme'))
        )
    }

    /**
     * reads a random meme
     */
    getRandomMeme() : Observable<Object | Meme> {
        let url = environment.apiUrl + '/meme/random'
        return this._http.get(url).pipe(
            catchError(this.handleError<Meme>('getRandomMeme'))
        )
    }

    /**
     * reads all memes matching the query
     *
     * @param query
     * @param options
     */
    getMemes(query = {}, options = {}, sort = {}, search = {}, filter = {}): Observable<Object | Meme[]> {
        let url = environment.apiUrl + '/meme?q=' + JSON.stringify(query) + '&o=' + JSON.stringify(options) + '&s=' + JSON.stringify(sort) + '&fu=' + JSON.stringify(search)  + '&fi=' + JSON.stringify(filter)
        console.log(url)
        return this._http.get(url).pipe(
            catchError(this.handleError<Meme[]>('getMemes', []))
        )
    }

    /**
     * loads templates (uploaded images)
     *
     */
    loadTemplates(): any {
        let url = environment.apiUrl + '/templates'
        return this._http.get(url).pipe(
            catchError(this.handleError<Meme[]>('loadTemplates', []))
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
