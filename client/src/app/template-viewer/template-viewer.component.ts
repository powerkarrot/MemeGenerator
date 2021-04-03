import {Component, OnInit, Inject} from '@angular/core'
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Template} from '../template'
import {MemeService} from '../meme.service'
import { LocalStorageService } from '../localStorage.service';
import { Userdata } from '../userdata';
import { ToastService } from '../toast-service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbdModalContent } from '../meme-singleview/meme-singleview.component';


export interface DialogData {
    template : any
  }

@Component({
    selector: 'app-template-viewer',
    templateUrl: './template-viewer.component.html',
    styleUrls: ['./template-viewer.component.css']
})
export class TemplateViewerComponent implements OnInit {


    loggedIn = false
    userData: Userdata
    url

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
      console.log("template is: " + JSON.stringify(this.data.template))
    }

    share(): void {
      const modalRef = this.modalService.open(NgbdModalContent)
      modalRef.componentInstance.url = this.url
  }

    templateStats() {}

    vote(positive: boolean): void {
      
      this.memeService.voteTemplate(this.data.template._id, positive,
                                this.userData._id, this.userData.username,
                                this.userData.api_cred).subscribe((data) => {
          if (data.status == 'ERROR'){
              this.toastService.showDanger(("User already voted"))

          } else {
              this.data.template = data
              this.data.template.url = this.url
              this.localStorageService.updateLocalStorage()
              this.toastService.showSuccess("Successfully voted")
          }
      })
  }

  isLoggedIn(): boolean {
    if(this.localStorageService.hasLocalStorage()){
        this.userData = <Userdata>this.localStorageService.getLocalStorage()
        return true
    }
    return false
  }
}
