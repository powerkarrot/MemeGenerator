import {Component, OnInit} from '@angular/core'
import {MemeService} from '../meme.service'
import {Meme} from '../meme'

@Component({
    selector: 'app-meme-overview',
    templateUrl: './meme-overview.component.html',
    styleUrls: ['./meme-overview.component.css']
})
export class MemeOverviewComponent implements OnInit {

    memes: Meme[] = []
    throttle = 100
    scrollDistance = 1
    scrollUpDistance = 2
    limit = 0
    skip = 0

    /**
     *
     * @param memeService
     */
    constructor(private memeService: MemeService) {
    }

    /**
     * calculates loading limit using screen size and size of meme div
     * loads the first amount of memes
     */
    ngOnInit(): void {
        this.limit = Math.ceil(window.innerWidth / 250) * Math.ceil(window.innerHeight / 250)
        this.loadMemes()
    }

    /**
     * load memes considering limit and updates skip value
     */
    loadMemes(): void {
        const options = {
            limit: this.limit,
            skip: this.skip,
            sort: {_id: -1}
        }
        this.memeService.getMemes({}, options).subscribe((memes) => {
            this.memes = this.memes.concat(<Meme[]>memes)
            this.skip += this.limit
        })
    }

}
