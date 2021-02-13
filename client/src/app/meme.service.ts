import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; 
import { Meme } from './meme';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemeService {

  constructor(private http: HttpClient) { }

  getMemes(): Observable<Object | Meme[]> {
    let url = environment.apiUrl + '/meme'
    let jsonMemes = this.http.get(url).pipe(
      catchError(this.handleError<Meme[]>('getMemes', []))
    );
    return jsonMemes;
  }

  getAdjacentMemes(id: string): Observable<Object | Meme[]> {
    let url = environment.apiUrl + '/meme/neigh/' + id;
    let jsonMemes = this.http.get(url).pipe(
      catchError(this.handleError<Meme[]>('getAdjacentMemes', []))
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
