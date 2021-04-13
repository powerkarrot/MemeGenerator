import {Component, OnInit} from '@angular/core'
import {MemeService} from '../meme.service'
import {Meme} from '../meme'
import {ActivatedRoute} from '@angular/router'
import {tuiPure} from '@taiga-ui/cdk'
import {SpeechSynthesisUtteranceOptions} from '@ng-web-apis/speech'
import {LocalStorageService} from '../localStorage.service'


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

    // Voice recognition
    text = ""
    paused = false
    voice = null

    /**
     *
     * @param memeService
     */
    constructor(
        private memeService: MemeService,
        private _route: ActivatedRoute,
        private localStorageService: LocalStorageService,

        ) {
    }

    /**
     * calculates loading limit using screen size and size of meme div
     * handles possible search/filter/sort parameters in url
     * loads the first amount of memes
     */
    ngOnInit(): void {
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
        this.paused = !this.localStorageService.getVoiceControlStatus()
    }

    /**
     * Configure options for voice detecting
     * @param voice 
     * @returns 
     */
    @tuiPure
    private getOptions( voice: SpeechSynthesisVoice | null,): SpeechSynthesisUtteranceOptions {
        return {
            lang: 'en-US',
            voice,
        };
    }

    /**
     * Function the get the voice recognition results
     */
    get options(): SpeechSynthesisUtteranceOptions {
        return this.getOptions(this.voice);
    }

    /**
     * Read a meme out loud
     * @param event html event  
     * @param meme meme that should be read
     */
    sayMeme(event, meme: Meme): void {
        this.paused = !this.localStorageService.getVoiceControlStatus()
        if(!this.paused) {
            this.text = ""
            this.text = this.describeMeme(meme)
        }
    }
    /**
     * Creates a string representation of a meme for reading it out lout
     * @param meme the meme that should be described
     * @returns 
     */
    describeMeme(meme: Meme): string {
        let text = "The title of the meme is: " + meme.title + " and has a description stating: " + meme.description
        if(meme.topText) {
            text += ", having a top text with caption: " + meme.topText
        }
        if(meme.bottomText) {
            text += " and a bottom caption stating: " + meme.bottomText
        }
        text += ", this meme has " + meme.views + " views and " + meme.votes + " votes."
        return text
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
            this.memes = this.memes.concat(<Meme[]>memes)
            this.skip += this.limit
        })
    }
}
