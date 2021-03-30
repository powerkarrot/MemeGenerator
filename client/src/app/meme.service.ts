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

    voteMeme(id: number, isUpvote : boolean, userid: number, username: string, apicred: number): Observable<any> {
        if (id !== null) {
            let url = environment.apiUrl + '/meme/vote/' + id
            const vote = isUpvote ? 1 : -1
            const data = {
                "userid": userid,
                "username": username,
                "cred": apicred,
                "vote": vote
            }
            return this._http.post(url, data).pipe(
                catchError(this.handleError<any>('voteMeme'))
            )
        }
    }
    

    commentMeme(id: number, userid: number, username: string, apicred: number, comment: string): Observable<any> {
        if(id !== null) {
            let url = environment.apiUrl + '/meme/comment/' + id
            const data = {
                "userid": userid,
                "username": username,
                "cred": apicred,
                "comment": comment 
            }
            return this._http.post(url, data).pipe(
                catchError(this.handleError<any>('commentMeme'))
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
     * @param sort 
     * @param search 
     * @param filter 
     * @returns 
     */
    getMemes(query = {}, options = {}, sort = null, search = null, filter = null): Observable<Object | Meme[]> {
        let url = environment.apiUrl + '/meme?q=' + JSON.stringify(query) + '&o=' + JSON.stringify(options) 
        
        if(sort) 
            url += '&s=' + JSON.stringify(sort)  
        if(search)
            url += '&fu=' + JSON.stringify(search)
        if(filter)
            url += '&fi=' + JSON.stringify(filter)
         
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
     *  
     * Sends a GET request to the imgFlip API
     * Returns the response 
     *
     * @returns 
     */
    getImgAPITemplates() : any {
        let url = "https://api.imgflip.com/get_memes"
        return this._http.get(url).pipe(
            catchError(this.handleError<Meme[]>('getImgAPITemplates', []))
        )
    }

    /**
     * Tests the /createMemes route
     * 
     * @param data 
     * @returns 
     */
    testCreateMemeAPI(data): Observable<Object | Meme> {
        let url = environment.apiUrl + '/createMemes'
        return this._http.post(url, data).pipe(
            catchError(this.handleError<Meme>('testcreateMemeAPI'))
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
