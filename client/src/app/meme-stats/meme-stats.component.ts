import {Component, OnInit} from '@angular/core'
import {Router} from '@angular/router'
import {MemeService} from '../meme.service'
import {LocalStorageService} from '../localStorage.service'
import {MatChipInputEvent} from '@angular/material/chips';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { multi } from './data'
import { viewsSingle } from './pieData';
import { votesSingle } from './votesDataPie';

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
    memeID

    multi: any[]
    single: any[]

    view: any[] = [2000, 1000];
    pieView: any[] = [700, 500];

    // graph options
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
    showGridLines = true
    legendTitle = "Chart"
    roundDomains = false

    //pie options
    pieGradient: boolean = true;
    pieShowLegend: boolean = true;
    pieShowLabels: boolean = true;
    pieIsDoughnut: boolean = false;
    pieToolTip: boolean = false

    showLegend: boolean = true;
    isDoughnut: boolean = false;
    legendPosition: string = 'below';


    colorScheme = {
        domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    };

    pieColorScheme = {
        domain: ['#5AA454',  '#7aa3e5']
    };

    pieColorScheme2 = {
        domain: ['#E44D25','#a8385d']
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
        this.subscription = this._route.params.subscribe(params => {
            this.memeID = params['id']
        })
        this.isLoggedIn = lss.hasLocalStorage()
        this.loadMemes()
        console.log("constructor")
      


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


      onSelectPie(data): void {
        console.log('Item clicked', JSON.parse(JSON.stringify(data)));
      }
    

    /**
     * watches meme for changes and updates it
     */
    ngOnInit(): void {
        console.log("init")

    }

    async loadMemes() {
       
        //this.subscription = this._route.params.subscribe(params => {
            //const id = params['id']
            const id = this.memeID
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

                let maxVotes = Math.max.apply(Math, voteDataSeries.map(function(o) { return o.votes; }))
                let minVotes = Math.min.apply(Math, voteDataSeries.map(function(o) { return o.votes; }))

                for (var i = 0; i < viewDataSeries.length; i++) {
                    var date = new Date (viewDataSeries[i].timestamp)
                    //console.log(date.toDateString())
                   
                    multi[0].series.push(
                        {
                            "name": viewDataSeries[i].timestamp,
                            "value": viewDataSeries[i].views, 
                           // "min" : 0,
                           // "max" : 0
                        }   
                    )
                }

                for (var i = 0; i < voteDataSeries.length; i++) {
                    console.log("ierative votes are: " + voteDataSeries[i].votes)
                    console.log("all votes are" + this.currentMeme.votes)

                   
                    multi[1].series.push(
                        {
                            "name": voteDataSeries[i].timestamp,
                            "value": voteDataSeries[i].votes, 
                           // "min" : minVotes,
                           // "max" : maxVotes
                        }
                    )
                }

                console.log("180")
                Object.assign(this, {multi});
                console.log(multi)

                console.log("DONE with MULTI")

                let options = {
                    //limit: 1,
                    //sort: {_id: -1}
                }
                this._memeService.getMemes({_id: {$lt: this.memeID}}, options).subscribe((data) => {
                    this.allMemes = data
                    console.log("Got ALL MEMES")

                    let views = this.currentMeme.views
                    console.log(views)
                    let votes = this.currentMeme.votes
                
                    let allViews = data.reduce( function(cnt,o){ return cnt + o.views; }, 0)
                    console.log(allViews)

                    let allVotes = data.reduce( function(cnt,o){
                         let voteCnt = o.voteData == undefined ? 0 : o.voteData.length
                         return cnt + voteCnt
                        }, 0)
                    
                    console.log(allVotes)


                    viewsSingle[0] = (
                        {
                            "name": "Views",
                            "value": views
                        }   
                    )
                    viewsSingle[1] = (
                        {
                            "name": "All Views",
                            "value": allViews 
                        }   
                    )
                    votesSingle[0] = (
                        {
                            "name": "Votes",
                            "value": votes
                        }   
                    )
                    votesSingle[1] = (
                        {
                            "name": "All Votes",
                            "value": allVotes 
                        }   
                    )
                    console.log("assigning")
                    Object.assign(this, { viewsSingle });
                    Object.assign(this, { votesSingle });

                })
            })
            console.log("DONE")

        //})   
    } 
    
    async loadPieData() {
        let options = {
            //limit: 1,
            //sort: {_id: -1}
        }
        this._memeService.getMemes({_id: {$lt: this.memeID}}, options).subscribe((data) => {
            this.allMemes = data
           // console.log(this.allMemes)
           console.log("192")
            Object.assign(this, {multi });
            console.log(multi)

        })
    }
}
