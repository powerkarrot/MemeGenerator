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


    constructor(private userService: UserService) {
    }

    ngOnInit(): void {
    }

    onClickSubmit(data) {
        this.userService.register(data.username, data.password).subscribe((res) => {
            console.log(res)
        })
    }

    onValueChanged($event): void {
        console.log(this.model)
    }

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
