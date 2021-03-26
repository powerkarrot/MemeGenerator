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
     * handles possible search/filter/sort parameters in url
     * loads the first amount of memes
     */

    //TODO: search und sort in q dingsen bsp "title": type search / votes: type sort / png: type filter
    ngOnInit(): void {

        var  test = { 
                    url: "http://pngimg.com/uploads/dog/dog_PNG50322.png", 
                    text: [
                        {title: "title6", 
                        description: "Lmeh", 
                        topText: "DUUUUUUUUUUUDE",
                        bottomText: "thetheh" ,
                        topX: 200,
                        topY: 200,
                        bottomX: 200,
                        bottomY: 200
                     },
                     {title: "title7", 
                        description: "ugh", 
                        topText: "never",
                        bottomText: "again" ,
                        topX: 200,
                        topY: 200,
                        bottomX: 200,
                        bottomY: 200
                     },
                     {title: "title8", 
                        description: "welll", 
                        topText: "FUUUUUUU",
                        bottomText: "AAARRRGGHHHHH" ,
                        topX: 200,
                        topY: 200,
                        bottomX: 200,
                        bottomY: 200
                     }
                    ]
                }

        this.memeService.test("kmkm", test).subscribe((meme) => {
            //this.meme = meme
            // @ts-ignore
            this.id = meme._id
        })

        this.limit = Math.ceil(window.innerWidth / 250) * Math.ceil(window.innerHeight / 250)

        this._route.queryParams.subscribe(params => {
            let order = -1
            if(params.sort) {
                if(params.order) {
                    order = (params.order == "Up") ? 1 : -1
                } 
                this.category = params.sort
                if(this.category == 'title') this.sort = {title:order}
                else if (this.category == 'votes') this.sort = {votes:order}
                else if (this.category == 'views') this.sort = {views:order}
                else if (this.category == 'creation date') this.sort = {dateAdded:order}
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
     * loads memes considering limit and possible search/filter/sort parameters
     * updates skip value
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
