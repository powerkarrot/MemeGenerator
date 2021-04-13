import { Component, OnInit, Inject } from '@angular/core'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Template } from '../template'
import { MemeService } from '../meme.service'
import { LocalStorageService } from '../localStorage.service';
import { Userdata } from '../userdata';
import { ToastService } from '../toast-service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbdModalContent } from '../meme-singleview/meme-singleview.component';

export interface DialogData {
  template: any
}

@Component({
  selector: 'app-template-viewer',
  templateUrl: './template-viewer.component.html',
  styleUrls: ['./template-viewer.component.scss']
})
export class TemplateViewerComponent implements OnInit {


  loggedIn = false
  userData: Userdata
  url
  panelOpenState = false;
  numGen: any;
  template: Template = null
  voteDataSeries: any[] = null
  viewDataSeries: any[] = null
  generatedDataSeries: any[] = null

  multi = [
    {
      "name": "Views",
      "series": []
    },
    {
      "name": "Votes",
      "series": []
    },
    {
      "name": "Generated",
      "series": []
    }
  ];


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
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#7aa3e5']
  }

  /**
  * 
  * @param memeService 
  * @param localStorageService 
  * @param toastService 
  * @param dialogRef 
  * @param data 
  */
  constructor(
    private memeService: MemeService,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private modalService: NgbModal,
    public dialogRef: MatDialogRef<TemplateViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {

    this.url = this.data.template.url
    this.initCharts()
  }

  /**
   * Closes the dialog
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * 
   */
  ngOnInit(): void {
    this.loggedIn = this.isLoggedIn()
  }

  /**
   * Shares the template
   */
  share(): void {
    const modalRef = this.modalService.open(NgbdModalContent)
    modalRef.componentInstance.url = this.url
  }

  /**
   * Votes for template and updates chart
   * 
   * @param positive 
   */
  vote(positive: boolean): void {

    this.memeService.voteTemplate(this.data.template._id, positive,
      this.userData._id, this.userData.username,
      this.userData.api_cred, this.data.template).subscribe((data) => {
        if (data.status == 'ERROR') {
          this.toastService.showDanger(("User already voted"))
        } else {
          this.data.template = data
          this.data.template.url = this.url
          this.localStorageService.updateLocalStorage()
          this.toastService.showSuccess("Successfully voted")
          this.initCharts()
        }
      })
  }

  isLoggedIn(): boolean {
    if (this.localStorageService.hasLocalStorage()) {
      this.userData = <Userdata>this.localStorageService.getLocalStorage()
      return true
    }
    return false
  }

  /**
   * Initializes/updates graph and charts
   */ 
  initCharts() {

    this.template = this.data.template

    this.voteDataSeries = this.template.voteData
    this.viewDataSeries = this.template.viewData
    this.generatedDataSeries = this.template.generatedData

    //Graph data
    for (var i = 0; i < this.viewDataSeries.length; i++) {

      this.multi[0].series.push(
        {
          "name": this.viewDataSeries[i].timestamp,
          "value": <Number>this.viewDataSeries[i].views
        }
      )
    }

    for (var i = 0; i < this.voteDataSeries.length; i++) {

      this.multi[1].series.push(
        {
          "name": this.voteDataSeries[i].timestamp,
          "value": <number>this.voteDataSeries[i].votes,
        }
      )
    }

    for (var i = 0; i < this.generatedDataSeries.length; i++) {

      this.multi[2].series.push(
        {
          "name": this.generatedDataSeries[i].timestamp,
          "value": <number>this.generatedDataSeries[i].generated,
        }
      )
    }
    
    //extra assignment to let component know that data has been updated in case of dynamic changes
    this.multi = [...this.multi]
  }
}
