import {Component, OnInit, Input} from '@angular/core'
import {Meme} from '../meme'
import {HttpClient} from '@angular/common/http'
import {ActivatedRoute} from '@angular/router'
import {MemeService} from '../meme.service'
import {Router} from '@angular/router';
import {interval, Subscription} from 'rxjs';

@Component({
    selector: 'app-meme-singleview',
    templateUrl: './meme-singleview.component.html',
    styleUrls: ['./meme-singleview.component.css']
})
export class MemeSingleviewComponent implements OnInit {

    selectedMeme: Meme
    prevMeme: Meme
    nextMeme: Meme
    subscription: any
    timer: any

    model = {
        autoplay: false,
        random: false
    };

    /**
     *
     * @param _http
     * @param _route
     * @param memeService
     */
    constructor(private _http: HttpClient, private _route: ActivatedRoute, private memeService: MemeService, private router: Router) {
    }

    /**
     * loads memes
     */
    ngOnInit(): void {
        this._route.queryParams.subscribe(params => {
            console.log(params)
            if(params.autoplay === 'true') {
                this.model.autoplay = true
                this.onAutoplayClicked(null)
            }
            if(params.random === 'true') {
                this.model.random = true
            }
        })
        this.getMemes()
    }

    /**
     * loads current, prev and next meme
     */
    getMemes(): void {
        this.subscription = this._route.params.subscribe(params => {
            const id = params['id']
            this.memeService.getMeme(id).subscribe((data) => {
                // @ts-ignore
                this.selectedMeme = data
            })
            let options = {
                limit: 1,
                sort: {_id: -1}
            }
            this.memeService.getMemes({_id: {$lt: id}}, options).subscribe((data) => {
                this.nextMeme = data[0]
            })
            options.sort._id = 1
            this.memeService.getMemes({_id: {$gt: id}}, options).subscribe((data) => {
                this.prevMeme = data[0]
            })
        })
    }

    getRandomMeme(): void {
        
    }

    onAutoplayClicked($event): void {
        if (this.model.autoplay == true) {
            this.timer = interval(5000).subscribe((val) => {
                if(this.model.autoplay == true) {
                    if(this.model.random) {
                        this.memeService.getRandomMeme().subscribe((data) => {
                            const meme = <Meme>data
                            const url = '/meme/' + meme._id + '?autoplay=true&random=true'
                            this.router.navigateByUrl(url)
                        })
                    } else {
                        const url = '/meme/' + this.nextMeme._id + '?autoplay=true'
                        this.router.navigateByUrl(url)
                    }
                }
            })
        } else {
            this.timer.unsubscribe()
        }
    }

    ngOnDestroy() {
        this.timer.unsubscribe();
    }
}
