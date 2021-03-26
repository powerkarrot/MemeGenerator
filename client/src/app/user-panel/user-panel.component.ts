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

    constructor(private lss: LocalStorageService) { }

    ngOnInit(): void {
        
    }

    
}
