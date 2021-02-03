import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; 
import { Meme } from './meme';
import { MEMES } from './mock-memes';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MemeService {

  private imgFlipURL = 'https://api.imgflip.com/get_memes'

  constructor(private http: HttpClient) { }

  // Todo: load memes from the backend not from imfglip...
  getMemes(): Observable<Object | Meme[]> {
    let jsonMemes = this.http.get(this.imgFlipURL).pipe(
      catchError(this.handleError<Meme[]>('getMemes', []))
    );
    return jsonMemes;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
