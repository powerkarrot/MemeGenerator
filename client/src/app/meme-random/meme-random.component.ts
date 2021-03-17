import {Component, OnInit} from '@angular/core'
import {MemeService} from '../meme.service'
import {Meme} from '../meme'
import {Router} from '@angular/router';

@Component({
    selector: 'app-meme-random',
    templateUrl: './meme-random.component.html',
    styleUrls: ['./meme-random.component.css']
})
export class MemeRandomComponent implements OnInit {


    /**
     *
     * @param memeService
     */
    constructor(private memeService: MemeService, private router: Router) {
    }

    /**
     * calculates loading limit using screen size and size of meme div
     * loads the first amount of memes
     */
    ngOnInit(): void {
        this.loadRandomMeme()
    }

    /**
     * load memes considering limit and updates skip value
     */
    loadRandomMeme(): void {
        this.memeService.getRandomMeme().subscribe((meme) => {
            const url = '/meme/' + meme._id
            this.router.navigateByUrl(url)
        })
    }
}
