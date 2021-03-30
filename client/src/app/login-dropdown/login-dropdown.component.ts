import {Component, OnInit} from '@angular/core'
import {UserService} from '../user.service'
import { Userdata } from '../userdata'
import {LocalStorageService} from '../localStorage.service'

@Component({
    selector: 'app-login-dropdown',
    templateUrl: './login-dropdown.component.html',
    styleUrls: ['./login-dropdown.component.css']
})
export class LoginDropdownComponent implements OnInit {

    isLoggedIn = false
    userData : Userdata

    /**
     *
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(private userService: UserService, private localStorageService: LocalStorageService) { }

    ngOnInit(): void {
        if(this.localStorageService.hasLocalStorage()){
            this.userData = <Userdata>this.localStorageService.getLocalStorage()
        }
        //this.localStorageService.deleteLocalStorage()
        this.localStorageService.updateLocalStorage()
        this.isLoggedIn = this.localStorageService.hasLocalStorage()
    }

    onClickSubmit(data): void {
        if(!this.isLoggedIn){
            this.userService.login(data.username, data.password).subscribe((res) => {
                const userdata = <Userdata>res.data
                this.localStorageService.storeOnLocalStorage(userdata)
                this.userData = <Userdata>this.localStorageService.getLocalStorage()
                this.isLoggedIn = true
            })
        }
    }

    logout(): void {
        if(this.isLoggedIn) {
            this.userService.logout(this.userData._id, this.userData.api_cred).subscribe((res) => {
                this.localStorageService.deleteLocalStorage()
                this.isLoggedIn = this.localStorageService.hasLocalStorage()
            })
        }
    }
}
