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

    ngOnInit(): void {
        this.loadRandomMeme()
    }

    /**
     * loads a random meme and navigates to the single view
     */
    loadRandomMeme(): void {
        this.memeService.getRandomMeme().subscribe((data) => {
            const meme = <Meme>data
            const url = '/meme/' + meme._id
            this.router.navigateByUrl(url)
        })
    }
}
