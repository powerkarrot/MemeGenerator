import {Component, OnInit} from '@angular/core'
import {Userdata} from '../userdata'
import {Meme} from '../meme'
import {LocalStorageService} from '../localStorage.service'
import {MemeService} from '../meme.service'

@Component({
    selector: 'app-user-panel',
    templateUrl: './user-panel.component.html',
    styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit {

    isLoggedIn = false
    userData : Userdata
    votes = 0
    views = 0
    memes : Meme[]
    likedMemes : Meme[]
    dislikedMemes : Meme[]
    drafts: Meme[]

    constructor(private lss: LocalStorageService, private memeService: MemeService) { }

    ngOnInit(): void {
        this.userData = this.lss.getLocalStorage()
        console.log(this.userData)
        this.calcVotes()
        this.getMemes()
        this.getLikedMemes()
        this.getDislikedMemes()
        this.getDrafts()
    }

    /**
     * Calculates the total amount of votes the user has generated
     */
    calcVotes(): void {
        if(this.userData && this.userData.memes.length > 0){
            // ToDo: broken
            let vo = 0
            let vi = 0
            this.userData.memes.forEach(function(meme) {
                vo += meme.votes
                vi += meme.views
            })
            this.votes = vo
            this.views = vi
        } else {
            this.votes = 0
            this.views = 0
        }
    }

    /**
     * Gets the memes the user has created
     */
    getMemes(){
        var memeids = []
        this.userData.memes.forEach(function(meme) {
            memeids.push(meme.memeid)
        })
        const query = {
            '_id': {
                '$in': memeids
            }
        }
        this.memeService.getMemes(query).subscribe((memes) => {
            this.memes = <Meme[]> memes
        })
    }

    /**
     * Gets the memes a user has liked
     */
    getLikedMemes() {
        var memeids = []
        this.userData.votes.forEach(function(meme) {
            if(meme.isPositive)
                memeids.push(meme.memeid)
        })

        const query = {
            '_id': {
                '$in': memeids
            }
        }

        this.memeService.getMemes(query).subscribe((memes) => {
            this.likedMemes = <Meme[]> memes
        })
    }

    /**
     * Gets the memes a user has disliked
     */
    getDislikedMemes() {
        var memeids = []
        this.userData.votes.forEach(function(meme) {
            if(!meme.isPositive)
                memeids.push(meme.memeid)
        })

        const query = {
            '_id': {
                '$in': memeids
            }
        }

        this.memeService.getMemes(query).subscribe((memes) => {
            this.dislikedMemes = <Meme[]> memes
        })
    }

    /**
     * Gets draft a user has created
     */
    getDrafts(){
        var memeids = []
        if(this.userData.drafts){
            this.userData.drafts.forEach(function(draft){
                memeids.push(draft.memeid)
            })
        }

        console.log("Query for: ", memeids)

        const query = {
            '_id': {
                '$in': memeids
            }
        }
        this.memeService.getDrafts(query).subscribe((drafts) => {
            this.drafts = <Meme[]> drafts
            console.log("Drafts: ", drafts)
        })
    }
    
}
