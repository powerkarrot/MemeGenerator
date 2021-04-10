import {Component, OnInit} from '@angular/core'
import {UserService} from '../user.service'

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

    model = {
        username: "",
        password: "", 
        password_re:""
    }
    pw_match = false
    status = "Password does not match!"
    complete = false


    constructor(private userService: UserService) {
    }

    ngOnInit(): void {
    }

    /**
     * Register the user 
     * @param data formdata
     */
    onClickSubmit(data) {
        this.userService.register(data.username, data.password).subscribe((res) => {
            console.log(res)
            this.complete = true
        })
    }

    /**
     * Debug function to print the model binding
     * @param $event 
     */
    onValueChanged($event): void {
        console.log(this.model)
    }

    /**
     * Checks if the passwords fields match and updates the status
     * @param $event 
     */
    keyEvent($event): void {
        if(this.model.password == this.model.password_re){
            this.pw_match = true
            this.status = "Password match!"
        } else {
            this.pw_match = false
            this.status = "Password does not match!"
        }
    } 

}
