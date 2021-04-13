import {Component, OnInit} from '@angular/core'
import {MemeService} from '../meme.service'
import {LocalStorageService} from '../localStorage.service'
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
    allMemes: Meme[] = []
    title
    memeID
    numComments = 0
    units: string = 'comments'
    previousValue = 0
    multi = []

    //: any[]
    viewsSingle: any[]
    votesSingle: any[]

    // graph options
    legend: boolean = true
    showLabels: boolean = true
    animations: boolean = true;
    xAxis: boolean = true
    yAxis: boolean = true
    showYAxisLabel: boolean = true
    showXAxisLabel: boolean = true
    xAxisLabel: string = 'Date'
    yAxisLabel: string = 'Value'
    timeline: boolean = true
    gradient = true
    showGridLines = true
    legendTitle = "Chart"

    //pie chart options
    pieGradient: boolean = true
    pieShowLegend: boolean = true
    pieShowLabels: boolean = true
    pieIsDoughnut: boolean = false
    pieToolTip: boolean = false
    showLegend: boolean = true
    isDoughnut: boolean = false
    legendPosition: string = 'below'


    colorScheme = {
        domain: ['#5AA454', '#E44D25']
    }

    pieColorScheme = {
        domain: ['#5AA454',  '#7aa3e5']
    }

    pieColorScheme2 = {
        domain: ['#E44D25','#a8385d']
    }

    colorSchemeComments  = {
        domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    }

    /**
     * 
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(
       
        private _memeService: MemeService,
        private _route: ActivatedRoute, 
        private lss: LocalStorageService
    ){

    this.multi = [
        {
            "name": "Views",
            "series": []   
        },
        {
            "name": "Votes",
            "series": []
        }]

        this.subscription = this._route.params.subscribe(params => {
            this.memeID = params['id']
        })
        this.isLoggedIn = lss.hasLocalStorage()
        this.initCharts()

    }
    
    /**
     * watches meme for changes and updates it
     */
    ngOnInit(): void {

    }

    /**
     * Initializes graph and charts
     */
    initCharts() {

       
        const id = this.memeID
        this.multi[0].name = "Views"
        this.multi[1].name = "Votes"

        this._memeService.getMeme(id).subscribe((data) => {

            this.currentMeme = <Meme>data
            this.title = this.currentMeme.title //attach to form

            let voteDataSeries = this.currentMeme.voteData
            let viewDataSeries = this.currentMeme.viewData

            voteDataSeries.map(t => {t.timestamp = new Date (t.timestamp).toString()})
            viewDataSeries.map(t => {t.timestamp = new Date (t.timestamp).toString()})
            voteDataSeries.push({
                timestamp : viewDataSeries[viewDataSeries.length-1].timestamp,
                votes : voteDataSeries[voteDataSeries.length-1].votes
            })

            //comment chart data
            this.numComments = this.currentMeme.comments.length

            //Graph data
            for (var i = 0; i < viewDataSeries.length; i++) {

                this.multi[0].series.push(
                    {
                        "name": viewDataSeries[i].timestamp,
                        "value": <Number> viewDataSeries[i].views, 
                    }   
                )
            }

            for (var i = 0; i < voteDataSeries.length; i++) {
                    
                this.multi[1].series.push(
                    {
                        "name": voteDataSeries[i].timestamp,
                        "value": <Number> voteDataSeries[i].votes, 
                    }
                )
            }

            //assign object
            this.multi = [...this.multi]

            //Pie chart data
            let options = {}
            this._memeService.getMemes({}, options).subscribe((data) => {

                this.allMemes = this.allMemes.concat(<Meme[]>data)

                let views = this.currentMeme.views
                let votes = this.currentMeme.voteData.length
            
                let allViews = this.allMemes.reduce( function(cnt,o){ return cnt + o.views; }, 0)

                let allVotes = this.allMemes.reduce( function(cnt,o){
                        let voteCnt = o.voteData == undefined ? 0 : o.voteData.length
                        return cnt + voteCnt
                }, 0)

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
                Object.assign(this, { viewsSingle });
                Object.assign(this, { votesSingle });

            })
        })
    } 
}
