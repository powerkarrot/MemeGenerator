import {Component, OnInit} from '@angular/core'
import {Router} from '@angular/router'
import {MemeService} from '../meme.service'
import {LocalStorageService} from '../localStorage.service'
import {MatChipInputEvent} from '@angular/material/chips';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { multi } from './data'
import {Meme} from '../meme'
import {ActivatedRoute} from '@angular/router'







@Component({
    selector: 'app-meme-stats',
    templateUrl: './meme-stats.component.html',
    styleUrls: ['./meme-stats.component.scss']
})
export class MemeStatsComponent implements OnInit {

    
    
    isLoggedIn = false
    subscription: any
    currentMeme: Meme
    allMemes
    title



    multi: any[]



    view: any[] = [1500, 800];

    // options
    legend: boolean = true;
    showLabels: boolean = true;
    animations: boolean = true;
    xAxis: boolean = true;
    yAxis: boolean = true;
    showYAxisLabel: boolean = true;
    showXAxisLabel: boolean = true;
    xAxisLabel: string = 'Date';
    yAxisLabel: string = 'Value';
    timeline: boolean = true;
    gradient = true
    showGridLines = false
    legendTitle = "FUCK ME"


    colorScheme = {
        domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    };


    /**
     *
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(
       
        private _router: Router,
        private _memeService: MemeService,
        private _route: ActivatedRoute, 

        
            
        private lss: LocalStorageService


    ){
        this.isLoggedIn = lss.hasLocalStorage()
        this.loadMemes()



    }

    onSelect(data): void {
        console.log('Item clicked', JSON.parse(JSON.stringify(data)));
      }
    
      onActivate(data): void {
        console.log('Activate', JSON.parse(JSON.stringify(data)));
      }
    
      onDeactivate(data): void {
        console.log('Deactivate', JSON.parse(JSON.stringify(data)));
      }

    /**
     * watches meme for changes and updates it
     */
    ngOnInit(): void {

    }

    async loadMemes() {
       
        this.subscription = this._route.params.subscribe(params => {
            const id = params['id']
            multi[0].name = "Views"
            multi[1].name = "Votes"
            multi[2].name = "All votes"
            multi[3].name = "All views"

            this._memeService.getMeme(id).subscribe((data) => {

                this.currentMeme = <Meme>data
                this.title = this.currentMeme.title //attach to form

                let voteDataSeries = this.currentMeme.voteData
                let viewDataSeries = this.currentMeme.viewData
                //multi[0].series[0].name = dataSeries[0].timestamp
                //multi[0].series[0].value = dataSeries[0].views

                voteDataSeries.map(t => {t.timestamp = new Date (t.timestamp).toString()})
                viewDataSeries.map(t => {t.timestamp = new Date (t.timestamp).toString()})


                for (var i = 0; i < voteDataSeries.length; i++) {
                    var date = new Date (voteDataSeries[i].timestamp)
                    //console.log(date.toDateString())
                   
                    multi[0].series.push(
                        {
                            "name": voteDataSeries[i].timestamp,
                            "value": voteDataSeries[i].views, 
                            "min" : 0,
                            "max" : this.currentMeme.views
                        }
                    )
  
                }

                for (var i = 0; i < viewDataSeries.length; i++) {
                    var date = new Date (viewDataSeries[i].timestamp)
                    console.log("ierative votes are: " + viewDataSeries[i].votes)
                    console.log("all votes are" + this.currentMeme.votes)

                   
                    multi[1].series.push(
                        {
                            "name": viewDataSeries[i].timestamp,
                            "value": viewDataSeries[i].votes, 
                            "min" : 0,
                            "max" : this.currentMeme.votes
                        }
                    )
  
                }
                
                Object.assign(this, {multi});

                console.log("DONE")
            })
            let options = {
                //limit: 1,
                //sort: {_id: -1}
            }
            this._memeService.getMemes({_id: {$lt: id}}, options).subscribe((data) => {
                this.allMemes = data
               // console.log(this.allMemes)
                Object.assign(this, {multi });

            })
        })

        
    }





    
  
}
