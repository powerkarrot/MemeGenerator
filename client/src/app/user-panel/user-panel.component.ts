import {Component, OnInit} from '@angular/core'
import { Userdata } from '../userdata'
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

    constructor(private lss: LocalStorageService, private memeService: MemeService) { }

    ngOnInit(): void {
        this.userData = this.lss.getLocalStorage()
        this.calcVotes()
        this.getMemes()
    }

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
        }
    }

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
        console.log(query)
        this.memeService.getMemes(query).subscribe((memes) => {
            console.log(memes)
        })
    }
    
}
