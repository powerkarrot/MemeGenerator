import { Component, OnInit } from '@angular/core';
import { MemeService } from '../meme.service';
import { Template } from '../template';

@Component({
  selector: 'app-meme-image',
  templateUrl: './meme-image.component.html',
  styleUrls: ['./meme-image.component.css']
})
export class MemeImageComponent implements OnInit {


  templates: Template[] = [];
  selectedTemplate: Template = null;
  

  throttle = 100;
  sum = 100;
  scrollDistance = 1;
  scrollUpDistance = 2;
  direction = '';

  maxCols: number; 
  cols: number;
  rows: number;

  constructor(private memeService: MemeService) { }

  onSelect(template: Template): void {
    console.log("Choosen: " + template.name)
    this.selectedTemplate = template;
  }

  ngOnInit(): void {
    this.getTemplates();
    this.maxCols = 9;
    this.rows = this.templates.length / this.maxCols;
  }

  addMemes(startIndex, endIndex, _method) {
    let moreTemplates = this.loadMoreMemes();
    for (let i = 0; i < this.sum; i++) {
      this.templates.push(moreTemplates[i])
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

  getTemplates(): void {
    this.memeService.getTemplate().subscribe((data)=>{
      this.templates = data;
    });
  }

  loadMoreMemes(): Template[] {
    // Todo: Load real data...
    return this.templates;
  }
}