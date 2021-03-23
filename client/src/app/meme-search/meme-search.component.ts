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

    /**
     *
     * @param _formBuilder
     * @param _router
     */
    constructor( private router: Router){}

    ngOnInit(): void {
        console.log("hi")
    }

    searchMeme(): void {

        let searchstr = ""
        let sortstr = ""
        let filterstr = ""

        if(this.criteria) {
            sortstr = '&sort=' + this.criteria
        }
        if (this.inputText) {
            searchstr = 'title=' + this.inputText
            console.log(searchstr)
        }
        if(this.filters) {
            filterstr = '&filter=' + this.filters
            console.log(filterstr)
        }

        const ur1 = '/memes?'+ searchstr + sortstr + filterstr
        this.router.navigateByUrl(ur1)
    }

    onClickSubmit(data):void {
        
    }
}
