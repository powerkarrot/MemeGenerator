import { Component, OnInit } from '@angular/core';
import { MemeService } from '../meme.service';
import { Meme } from '../meme';

@Component({
  selector: 'app-meme-overview',
  templateUrl: './meme-overview.component.html',
  styleUrls: ['./meme-overview.component.css']
})
export class MemeOverviewComponent implements OnInit {

  memes: Meme[] = [];
  selectedMeme: Meme = null;
  

  throttle = 100;
  sum = 100;
  scrollDistance = 1;
  scrollUpDistance = 2;
  direction = '';

  maxCols: number; 
  cols: number;
  rows: number;

  constructor(private memeService: MemeService) { }

  onSelect(meme: Meme): void {
    this.selectedMeme = meme;
  }

  ngOnInit(): void {
    this.getMemes();
    this.maxCols = 9;
    this.rows = this.memes.length / this.maxCols;
  }

  addMemes(startIndex, endIndex, _method) {
    let moreMemes = this.loadMoreMemes();
    for (let i = 0; i < this.sum; i++) {
      this.memes.push(moreMemes[i])
    }
  }

  appendMemes(startIndex, endIndex) {
    this.addMemes(startIndex, endIndex, 'push');
  }

  prependItems(startIndex, endIndex){
    this.addMemes(startIndex, endIndex, 'unshift');
  }

  onScrollDown() {
    console.log('scrolled down!');
    const start = this.sum;
    this.sum + 100;
    this.appendMemes(start, this.sum);

    this.direction = 'down';
  }

  onUp() {
    console.log('scrolled up!');
  }

  getMemes(): void {
    this.memeService.getMemes().subscribe((memes)=>{
      this.memes = memes;
      this.memes.forEach((meme) => {
        meme.description = "";
        meme.votes = 0;
      });
      console.log("meme-overview: loaded ",this.memes.length, " memes.");

    });
  }

  loadMoreMemes(): Meme[] {
    // Todo: Load real data...
    return this.memes;
  }

}
