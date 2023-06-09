import {Injectable} from '@angular/core'
import {Observable, of} from 'rxjs'
import {Meme} from './meme'
import {Template} from './template'
import {HttpClient} from '@angular/common/http'
import {catchError} from 'rxjs/operators'
import {environment} from '../environments/environment'
import {Tag} from './tags'

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
    updateMeme(id, data): Observable<any | Meme> {
        let url = environment.apiUrl + '/meme'
        if (id !== null) url += '/' + id
        return this._http.post(url, data).pipe(
            catchError(this.handleError<Meme>('updateMeme'))
        )
    }

    /**
     * Votes for a meme
     * @param id 
     * @param isUpvote 
     * @param userid 
     * @param username 
     * @param apicred 
     * @returns 
     */
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

    /**

     * takes a screenshot from url link and returns the link to the generated image
     * @param link 
     * @returns 
     */
    takeScreenshot(link) : Observable<any>{
        let url = environment.apiUrl + '/screenshot' 
        const data = {
            "url": link,
        }
        return this._http.post(url, data).pipe(
            catchError(this.handleError<any>('takeScreenshot'))
        )
    }
    
    /**
     * Upserts a template
     * @param id 
     * @param data 
     * @returns updated template
     */
    updateTemplate(data, generated:boolean, description:boolean): Observable<Object | Template> {
        let url = environment.apiUrl + '/template'
        if (generated) url = url + "/generated"
        else if (description) url = url + "/description"

        return this._http.post(url, data).pipe(
            catchError(this.handleError<Template>('updateTemplate'))
        )
    }

    /**
     * vote for template
     * 
     * @param id 
     * @param isUpvote 
     * @param userid 
     * @param username 
     * @param apicred 
     * @param template 
     * @returns  updated template
     */
    voteTemplate(id: number, isUpvote : boolean, userid: number, username: string, apicred: number, template): Observable<any> {
        if (id !== null) {
            let url = environment.apiUrl + '/template/vote/' + id
            const vote = isUpvote ? 1 : -1
            const data = {
                "userid": userid,
                "username": username,
                "cred": apicred,
                "vote": vote,
                "template": template
            }
            return this._http.post(url, data).pipe(
                catchError(this.handleError<any>('voteTemplate'))
            )
        }
    }

    /**
     * Posts a comment on a meme
     * @param id 
     * @param userid 
     * @param username 
     * @param apicred 
     * @param comment 
     * @returns 
     */
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
     * deletes draft
     *
     * @param id
     */
    deleteDraft(id, userid: number, cred: number): Observable<any> {
        let url = environment.apiUrl + '/draft/delete/' + id

        const data = {
            userid: userid,
            cred: cred
        }

        return this._http.post(url, data).pipe(
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
     * Commits tags added in the singleview
     * @param id 
     * @param tags 
     * @param userid 
     * @param apicred 
     * @returns 
     */
    commitTags(id: number, tags: Tag, userid: number, apicred: number): Observable<Object | any> {
        let url = environment.apiUrl + '/meme/tag/' + id
        const data = {
            "_id": id,
            "tags": tags,
            "userid": userid,
            "cred": apicred
        }
        this._http.post(url, data).pipe(
            catchError(this.handleError<any>('commitTags'))
        )
        return this._http.post(url, data).pipe(
            catchError(this.handleError<any>('commitTags'))
        )
    }

    // Todo: Remove
    test(): Observable<any> {
        if(true) {
            let url = environment.apiUrl + '/tag'
            const data = { }
            return this._http.post(url, data).pipe(
                catchError(this.handleError<any>('commentMeme'))
            )
        }
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
     * reads all drafts matching the query
     * 
     * @param query 
     * @param options 
     * @param sort 
     * @param search 
     * @param filter 
     * @returns 
     */
    getDrafts(query = {}, options = {}, sort = null, search = null, filter = null): Observable<Object | Meme[]> {
        let url = environment.apiUrl + '/drafts?q=' + JSON.stringify(query) + '&o=' + JSON.stringify(options) 
        
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
     * Gets statistics to a certain meme id
     * @param id 
     * @returns 
     */
    getMemeStats(id): Observable<Object | Meme> {
        let url = environment.apiUrl + '/stats/' + id

        return this._http.get(url).pipe(
            catchError(this.handleError<Meme>('getMemeStats'))
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
