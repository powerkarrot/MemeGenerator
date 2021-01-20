import {Component, OnInit} from '@angular/core'
import {HttpClient} from '@angular/common/http'
import {environment} from '../../environments/environment'
import {ActivatedRoute} from '@angular/router';

@Component({
    selector: 'app-meme',
    templateUrl: './meme.component.html',
    styleUrls: ['./meme.component.css']
})
export class MemeComponent implements OnInit {

    meme: any
    subscription: any

    constructor(
        private _http: HttpClient,
        private _route: ActivatedRoute,
    ) {
    }

    ngOnInit(): void {
        this.subscription = this._route.params.subscribe(params => {
            const id = params['id']
            if (id !== undefined) {
                const url = environment.apiUrl + '/meme/' + id
                this._http.get(url).subscribe({
                    next: data => {
                        console.log(data)
                        this.meme = data
                    },
                    error: error => {
                        console.error(error)
                    }
                })
            }
        })

    }

}
