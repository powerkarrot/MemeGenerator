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
  limit = 0
  skip = 0

  maxCols: number;
  cols: number;
  rows: number;

  constructor(private memeService: MemeService) { }

  onSelect(meme: Meme): void {
    this.selectedMeme = meme;
  }

  ngOnInit(): void {
    this.limit = Math.ceil(window.innerWidth / 250) * Math.ceil(window.innerHeight / 250)
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
    this.getMemes()
    return
    const start = this.sum;
    this.sum + 100;
    this.appendMemes(start, this.sum);

    this.direction = 'down';
  }

  onUp() {
    console.log('scrolled up!');
  }

  getMemes(): void {
    this.memeService.getMemes(this.limit, this.skip).subscribe((memes)=>{
      this.memes = this.memes.concat(<Meme[]>memes);
      console.log("meme-overview: loaded ",this.memes.length, " memes.");
      console.log(this.memes);
      this.skip += this.limit
    });
  }

  loadMoreMemes(): Meme[] {
    // Todo: Load real data...
    return this.memes;
  }

}
