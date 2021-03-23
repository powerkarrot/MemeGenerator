import {Component, OnInit} from '@angular/core'
import {MemeService} from '../meme.service'
import {ActivatedRoute} from '@angular/router'
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
    query = {}
    sort = {}
    category
    search 
    filter

    /**
     *
     * @param memeService
     */
    constructor(
        private memeService: MemeService,
        private _route: ActivatedRoute, 

        ) {
    }

    /**
     * calculates loading limit using screen size and size of meme div
     * loads the first amount of memes
     */
    //TODO: search und sort in q dingsen bsp "title": type search / votes: type sort / png: type filter
    ngOnInit(): void {
        this.limit = Math.ceil(window.innerWidth / 250) * Math.ceil(window.innerHeight / 250)

        this._route.queryParams.subscribe(params => {
            if(params.sort) {
                this.category = params.sort
                if(this.category == 'title') {this.sort = {title:1}}
                else if (this.category == 'votes') {this.sort = {votes:1}}
                else if (this.category == 'views') {this.sort = {views:1}}
                else if (this.category == 'creation date') {this.sort = {dateAdded:1}}
                else this.sort = "{}" 
            }
            if(params.filter) {
                this.filter = params.filter
            }

            if(params.title) {
                this.search = params.title
            }
        })
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
        this.memeService.getMemes(this.query, options, this.sort, this.search, this.filter).subscribe((memes) => {
            console.log(this.query)
            this.memes = this.memes.concat(<Meme[]>memes)
            this.skip += this.limit
        })
    }
}
