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
            this.isLoggedIn = true
            this.userData = <Userdata>this.localStorageService.getLocalStorage()[0]
        }
        console.log("Has Userdata? - ",this.isLoggedIn)
    }

    onClickSubmit(data): void {
        if(!this.isLoggedIn){
            this.userService.login(data.username, data.password).subscribe((res) => {
                const userdata = <Userdata>res.data
                this.localStorageService.storeOnLocalStorage(userdata)
                this.userData = <Userdata>this.localStorageService.getLocalStorage()[0]
                this.isLoggedIn = true
            })
        }
    }

    logout(): void {
        if(this.isLoggedIn) {
            this.userService.logout(this.userData._id, this.userData.api_cred).subscribe((res) => {
                this.isLoggedIn = this.localStorageService.deleteLocalStorage()
                console.log(res)
            })
        }
    }
}
