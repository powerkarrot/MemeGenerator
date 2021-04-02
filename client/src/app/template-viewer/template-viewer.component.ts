import {Component, OnInit, Inject} from '@angular/core'
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Template} from '../template'

export interface DialogData {
    template : any
  }

@Component({
    selector: 'app-template-viewer',
    templateUrl: './template-viewer.component.html',
    styleUrls: ['./template-viewer.component.css']
})
export class TemplateViewerComponent implements OnInit {


    constructor(
        public dialogRef: MatDialogRef<TemplateViewerComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
        ) 
        {
            console.log("constructor: " + JSON.stringify(this.data))

        }
    
      onNoClick(): void {
        this.dialogRef.close();
      }

    /**
     * calculates loading limit using screen size and size of meme div
     * loads the first amount of memes
     */
    ngOnInit(): void {
    }
}
