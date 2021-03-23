import {Component, OnInit} from '@angular/core'
import {UserService} from '../user.service'
import { Userdata } from '../userdata'

@Component({
    selector: 'app-login-dropdown',
    templateUrl: './login-dropdown.component.html',
    styleUrls: ['./login-dropdown.component.css']
})
export class LoginDropdownComponent implements OnInit {
    /**
     *
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(private userService: UserService) { }

    ngOnInit(): void {
        
    }

    onClickSubmit(data): void {
        console.log(data)
        this.userService.login(data.username, data.password).subscribe((res) => {
            console.log(res)
            const userdata = <Userdata>res.data
            console.log(userdata)
        })
    }

}
