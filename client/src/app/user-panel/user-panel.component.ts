import {Component, OnInit} from '@angular/core'
import { Userdata } from '../userdata'
import {LocalStorageService} from '../localStorage.service'

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

    constructor(private lss: LocalStorageService) { }

    ngOnInit(): void {
        this.userData = this.lss.getLocalStorage()
        this.calcVotes()
    }

    calcVotes(): void {
        if(this.userData && this.userData.memes.length > 0){
            this.userData.memes.forEach(function(meme) {
                this.votes += meme.votes
                this.views += meme.views
            })
        }
    }
    
}
