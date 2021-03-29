import {Component, OnInit} from '@angular/core'
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';


@Component({
    selector: 'app-meme-search',
    templateUrl: './meme-search.component.html',
    styleUrls: ['./meme-search.component.css']
})
export class MemeSearchComponent implements OnInit {

    inputText
    criteria: string
    items: string[] = ['title', 'votes', 'creation date', 'views']
    filters: string
    fis: string[] = ['jpg', 'png']
    direction: string[] = ['Up','Down'] 
    order: string


    /**
     * @param _router
     */
    constructor( private router: Router){}

    ngOnInit(): void {
        console.log("hi")
    }

    /**
     * creates url containing query parameters from user input and redirects to main page
     */
    searchMeme(): void {

        let searchstr = ""
        let sortstr = ""
        let filterstr = ""
        let orderstr = ""

        if(this.criteria) {
            sortstr = '&sort=' + this.criteria
        }
        if (this.inputText) {
            searchstr = 'title=' + this.inputText
        }
        if(this.filters) {
            filterstr = '&filter=' + this.filters
        }
        if(this.order) {
            orderstr = '&order=' + this.order
        }

        const ur1 = '/memes?'+ searchstr + sortstr + filterstr + orderstr
        this.router.navigateByUrl(ur1)
    }

    /**
     * 
     * @param data 
     */
    onClickSubmit(data):void {
        
    }
}
