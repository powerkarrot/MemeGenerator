import {Component, OnInit} from '@angular/core'
import {HttpClient} from '@angular/common/http'
import {Router} from '@angular/router'
import {environment} from '../../environments/environment'

@Component({
    selector: 'app-memes',
    templateUrl: './memes.component.html',
    styleUrls: ['./memes.component.css']
})
export class MemesComponent implements OnInit {

    memes: any

    constructor(
        private _http: HttpClient,
        private _router: Router
    ) {
    }

    ngOnInit(): void {
        let url = environment.apiUrl + '/meme'
        this._http.get(url).subscribe({
            next: data => {
                console.log(data)
                this.memes = data
            },
            error: error => {
                console.error(error)
            }
        })
    }
}

