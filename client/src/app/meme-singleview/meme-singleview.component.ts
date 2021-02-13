import { Component, OnInit, Input } from '@angular/core';
import { Meme } from '../meme';
import {HttpClient} from '@angular/common/http'
import {environment} from '../../environments/environment'
import {ActivatedRoute} from '@angular/router';
import { MemeService } from '../meme.service';

@Component({
  selector: 'app-meme-singleview',
  templateUrl: './meme-singleview.component.html',
  styleUrls: ['./meme-singleview.component.css']
})
export class MemeSingleviewComponent implements OnInit {

  selectedMeme: Meme;
  prevMeme: Meme;
  nextMeme: Meme;
  subscription: any;

  constructor(private _http: HttpClient, private _route: ActivatedRoute, private memeService: MemeService) { }

  ngOnInit(): void {
    this.getMemes();
  }

  getMemes(): void {
    this.subscription = this._route.params.subscribe(params => {
      const id = params['id'];
      this.memeService.getAdjacentMemes(id).subscribe((data)=>{
        let index = 0;
        let count = 0;
        let memes = <Meme[]>data;
        memes.forEach((meme) => {
          if(meme._id == id)
            index = count;
          count++;
        })
        this.selectedMeme = memes[index];
        if(index > 0)
          this.prevMeme = memes[index - 1];
        if(index < memes.length)
          this.nextMeme = memes[index + 1];
        if(index == 0)
          this.prevMeme = undefined
      });
    })
    
  }
}
