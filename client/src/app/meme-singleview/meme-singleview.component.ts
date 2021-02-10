import { Component, OnInit, Input } from '@angular/core';
import { Meme } from '../meme';

@Component({
  selector: 'app-meme-singleview',
  templateUrl: './meme-singleview.component.html',
  styleUrls: ['./meme-singleview.component.css']
})
export class MemeSingleviewComponent implements OnInit {

  @Input() memes: Meme[];
  @Input() selectedMeme: Meme;

  constructor() { }

  ngOnInit(): void {
  }

}
