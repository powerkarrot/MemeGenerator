import {Component, OnInit} from '@angular/core'
import {FormBuilder, Validators} from '@angular/forms'
import {Router} from '@angular/router'
import {debounceTime} from 'rxjs/operators'
import {MemeService} from '../meme.service'
import {WebcamImage} from 'ngx-webcam'
import {Subject, Observable} from 'rxjs';


@Component({
    selector: 'app-meme-generator',
    templateUrl: './meme-generator.component.html',
    styleUrls: ['./meme-generator.component.css']
})
export class MemeGeneratorComponent implements OnInit {

    memeForm: any
    meme: any = null
    id = null
    templates = null
    public webcamImage: WebcamImage = null
    private trigger: Subject<void> = new Subject<void>()
    public showWebcam = false;


    /**
     *
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(
       
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _memeService: MemeService
    ) {
        this.memeForm = this._formBuilder.group({
            _id: [],
            imgUrl: [{
                value: null,
                disabled: false
            }],
            title: [{
                value: null,
                disabled: false
            }, Validators.required],
            topText: [{
                value: null,
                disabled: false
            }, Validators.required],
            topX: [{
                value: null,
                disabled: false
            }],
            topY: [{
                value: null,
                disabled: false
            }],
            bottomText: [{
                value: null,
                disabled: false
            }],
            bottomX: [{
                value: null,
                disabled: false
            }],
            bottomY: [{
                value: null,
                disabled: false
            }],
            file: [{
                value: null,
                disabled: false
            }],
            fileSource: [{
                value: null,
                disabled: false
            }],
        })
    }

    /**
     * watches meme for changes and updates it
     */
    ngOnInit(): void {
        this.memeForm.valueChanges
            .pipe(debounceTime(500))
            .subscribe(formData => {
                this.updateMeme()
            })
    }

    /**
     * loads templates (uploaded images)
     */
    loadTemplates(): void {
        this._memeService.loadTemplates().subscribe((templates) => {
            this.templates = templates
            this.templates = this.templates.map(i => 'http://localhost:3007/uploads/' + i)
        })
    }

    /**
     * selects template image
     *
     * @param url
     */
    selectTemplate(url): void {
        this.memeForm.patchValue({
            imgUrl: url,
        })
    }

    /**
     * updates the meme
     */
    updateMeme(): void {
        const formData = this.generateMemeFormData()
        this._memeService.updateMeme(this.id, formData).subscribe((meme) => {
            this.meme = meme
            // @ts-ignore
            this.id = meme._id
        })
    }

    /**
     * prepares meme data for sending to the server
     *
     * @private
     */
    private generateMemeFormData(): FormData {
        const formData = new FormData()

        const file = this.memeForm.get('fileSource').value
        if (file) {
            formData.append('file', file)
        }

        let imgUrl = this.memeForm.get('imgUrl').value
    
        if (imgUrl) {
            formData.append('url', imgUrl)
        }

        formData.append('title', this.memeForm.get('title').value)

        const topText = this.memeForm.get('topText').value
        if (topText) {
            formData.append('topText', topText)
        }

        const topX = this.memeForm.get('topX').value
        if (topX) {
            formData.append('topX', topX)
        }

        const topY = this.memeForm.get('topY').value
        if (topY) {
            formData.append('topY', topX)
        }

        const bottomText = this.memeForm.get('bottomText').value
        if (bottomText) {
            formData.append('bottomText', bottomText)
        }

        const bottomX = this.memeForm.get('bottomX').value
        if (bottomX) {
            formData.append('bottomX', bottomX)
        }

        const bottomY = this.memeForm.get('bottomY').value
        if (bottomY) {
            formData.append('bottomY', bottomY)
        }
        return formData
    }

    /**
     * handles file upload
     *
     * @param event
     */
    onFileChange(event): void {
        if (event.target.files.length > 0) {
            const file = event.target.files[0]
            const name = file.name.split('.')[0]

            this.memeForm.patchValue({
                fileSource: file,
                name: name,
                imgUrl: null
            })
        }
    }

    /**
     * deletes current meme and redirect to overview
     */
    discardMeme(): void {
        this._memeService.deleteMeme(this.id).subscribe((res) => {
            this._router.navigate(['/memes'])
        })
    }

    /**
     * redirects to memes overview
     * (since it has been already saved)
     */
    finishMeme(): void {
        this._router.navigate(['/meme/' + this.id])
    }

    /**
     * Trigger fired to capture and emit image
     */
    triggerSnapshot(): void {
        this.trigger.next();
    }

    /**
     * Gets the trigger Observable
     */
    public get triggerObservable(): Observable<void> {
        return this.trigger.asObservable();
    }

    /**
     * Toggles webcam visibility
     */
    public toggleWebcam(): void {
        this.showWebcam = !this.showWebcam;
    }

    /**
     * Handles captured webcam image
     * 
     * @param webcamImage 
     */
    handleImage(webcamImage: WebcamImage): void {

        this.webcamImage = webcamImage  
        let filename =  "webcamImage.jpeg"
        this.memeForm.patchValue({
            fileSource: this.dataurlToFile(webcamImage.imageAsDataUrl, filename),
            name: filename,
            imgUrl: null
        })
    }

    /**
     * 
     * @param dataurl 
     * @param filename 
     * @returns 
     * 
     * Converts DataURl to Blob und Blob to File
     * Adapted from https://stackoverflow.com/a/29390393 and https://stackoverflow.com/a/30470303
     * 
     */
    dataurlToFile(dataurl, filename) {

        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        let blob =  new Blob([u8arr], {type:mime});

        var b: any = blob;
        b.lastModifiedDate = new Date();
        b.name = filename;
    
        return <File>b;
    }
}
