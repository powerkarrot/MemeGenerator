import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; 
import { Template } from './template';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class MemeService {

  constructor(private http: HttpClient) { }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getTemplate(): Observable<Object | Template[]> {
    let url = environment.apiUrl + '/meme-template'
    let jsonTemplates = this.http.get(url).pipe(
      catchError(this.handleError<Template[]>('getTemplates', []))
    );
    return jsonTemplates;
  }
}