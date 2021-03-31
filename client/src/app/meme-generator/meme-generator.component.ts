import {Component, OnInit} from '@angular/core'
import {FormBuilder, Validators} from '@angular/forms'
import {Router} from '@angular/router'
import {debounceTime} from 'rxjs/operators'
import {MemeService} from '../meme.service'
import {WebcamImage} from 'ngx-webcam'
import {Subject, Observable} from 'rxjs'
import {LocalStorageService} from '../localStorage.service'
import {ActivatedRoute} from '@angular/router'
import {COMMA, SEMICOLON} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {Tag} from '../tags'
import {Meme} from '../meme'


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
    public showImgFlipTemplates = false
    public showUploadedTemplates = false
    isLoggedIn = false
    private isDraft = true

    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [COMMA];
    tags: Tag[] = [];

    /**
     *
     * @param _formBuilder
     * @param _router
     * @param _memeService
     */
    constructor(
       
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _memeService: MemeService,
        private lss: LocalStorageService,
        private _route: ActivatedRoute,
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
            description: [{
                value: null,
                disabled: false
            }, Validators.required],
            topText: [{
                value: null,
                disabled: false
            }, Validators.required],
            topSize: [{
                value: null,
                disabled: false
            }],
            topX: [{
                value: null,
                disabled: false
            }],
            topY: [{
                value: null,
                disabled: false
            }],
            topBold: [{
                value: null,
                disabled: false
            }],
            topItalic: [{
                value: null,
                disabled: false
            }],
            topColor: [{
                value: null,
                disabled: false
            }],
            bottomText: [{
                value: null,
                disabled: false
            }],
            bottomSize: [{
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
            bottomBold: [{
                value: null,
                disabled: false
            }],
            bottomItalic: [{
                value: null,
                disabled: false
            }],
            bottomColor: [{
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
            visibility: [{
                value: null,
                disabled: false
            }],
        })
        this.isLoggedIn = lss.hasLocalStorage()
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
        
       this._route.params.subscribe(params => {
            if(params.id) {
                console.log("Continue Draft")
                const id = params['id']
                this.id = id
                this.getDraft()
            }
        })
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
    
        if ((value || '').trim()) {
            this.tags.push({name: value.trim()});
        }
    
        if (input) {
            input.value = '';
        }
    }
    
    remove(tags: Tag): void {
        const index = this.tags.indexOf(tags);
    
        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    }

    /**
     * Toggles template view
     */
    public toggleImgFlip(): void {
        this.showImgFlipTemplates = !this.showImgFlipTemplates;
    }

    /**
     * Toggles template view
     */
    public toggleUploaded(): void {
        this.showUploadedTemplates = !this.showUploadedTemplates;
    }

    /**
     * loads templates (uploaded images)
     */
    loadTemplates(): void {
        this.toggleUploaded()
        if(this.showImgFlipTemplates) this.toggleImgFlip()
        this._memeService.loadTemplates().subscribe((templates) => {
            this.templates = templates
            this.templates = this.templates.map(i => 'http://localhost:3007/uploads/' + i)
        })
    }

    /**
     * Loads templates (downloaded from ImgFlip API)
     */
    imgFlipAPITemplates() : void {
        this.toggleImgFlip()
        if(this.showUploadedTemplates) this.toggleUploaded()
        this._memeService.getImgAPITemplates().subscribe((res) => {
            this.templates = []
            res.data.memes.forEach(i => this.templates.push(i.url))
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
            console.log(meme)
            this.meme = meme
            // @ts-ignore
            this.id = meme._id
        })
    }

    getDraft(): void {
        this._memeService.getDrafts({_id: this.id}).subscribe((draft) => {
            console.log(typeof(draft))
            this.meme = draft[0
            ]
            this.selectTemplate(this.meme.url)
            console.log("Meme set: ",this.meme)

            this.memeForm.patchValue({
                title: this.meme.title,
            })

            //this.updateMeme()
            
            this.patchMemeData(draft.url, draft.title, draft.description, draft.topText, draft.topSize, draft.topX, draft.topY,
                draft.topBold, draft.topItalic, draft.topColor, draft.bottomText, draft.bottomSize, draft.bottomX,
                draft.bottomY, draft.bottomBold, draft.bottomItalic, draft.bottomColor, draft.visibility)
            
            this._memeService.updateMeme(this.id, this.memeForm).subscribe((meme) => {
                console.log(meme)
                this.meme = meme
                // @ts-ignore
                this.id = meme._id
            })  
            
        })
    }

    private patchMemeData(imgUrl: string, title: string, description: string,
        topText: string, topSize: string, topX: string, topY: string, topBold: string, topItalic: string, topColor: string,
        bottomText: string, bottomSize: string, bottomX: string, bottomY: string, bottomBold, bottomItalic: string,bottomColor: string,
        visibility: string): void {

            if(imgUrl)
                this.memeForm.patchValue({imgUrl: this.meme.url})
            if(title)
                this.memeForm.patchValue({title: this.meme.title})
            if(description)
                this.memeForm.patchValue({description: this.meme.description})
            if(topText)
                this.memeForm.patchValue({topText: this.meme.topText})
            if(topSize)
                this.memeForm.patchValue({topSize: this.meme.topSize})
            if(topX)
                this.memeForm.patchValue({topX: this.meme.topX})
            if(topY)
                this.memeForm.patchValue({topY: this.meme.topY})
            if(topBold)
                this.memeForm.patchValue({topBold: this.meme.topBold})
            if(topItalic)
                this.memeForm.patchValue({topItalic: this.meme.topItalic})
            if(topColor)
                this.memeForm.patchValue({topColor: this.meme.topColor})
            if(bottomText)
                this.memeForm.patchValue({bottomText: this.meme.bottomText})
            if(bottomSize)
                this.memeForm.patchValue({bottomSize: this.meme.bottomSize})
            if(bottomX)
                this.memeForm.patchValue({bottomX: this.meme.bottomX})
            if(bottomY)
                this.memeForm.patchValue({bottomY: this.meme.bottomY})
            if(bottomBold)
                this.memeForm.patchValue({bottomBold: this.meme.bottomBold})
            if(bottomItalic)
                this.memeForm.patchValue({bottomItalic: this.meme.bottomItalic})
            if(bottomColor)
                this.memeForm.patchValue({bottomColor: this.meme.bottomColor})
            if(visibility)
                this.memeForm.patchValue({visibility: this.meme.visibility})
    }

    /**
     * prepares meme data for sending to the server
     *
     * @private
     */
    private generateMemeFormData(
        imgUrl: string = this.memeForm.get('imgUrl').value,
        title: string = this.memeForm.get('title').value,
        description: string = this.memeForm.get('description').value,
        topText: string = this.memeForm.get('topText').value,
        topSize: string = this.memeForm.get('topSize').value,
        topX: string = this.memeForm.get('topX').value,
        topY: string = this.memeForm.get('topY').value,
        topBold: string = this.memeForm.get('topBold').value,
        topItalic: string = this.memeForm.get('topItalic').value,
        topColor: string = this.memeForm.get('topColor').value,
        bottomText: string = this.memeForm.get('bottomText').value,
        bottomSize: string = this.memeForm.get('bottomSize').value,
        bottomX: string = this.memeForm.get('bottomX').value,
        bottomY: string = this.memeForm.get('bottomY').value,
        bottomBold: string = this.memeForm.get('bottomBold').value,
        bottomItalic: string = this.memeForm.get('bottomItalic').value,
        bottomColor: string = this.memeForm.get('bottomColor').value,
        visibility: string = this.memeForm.get("visibility").value

    ): FormData {
        const formData = new FormData()

        const file = this.memeForm.get('fileSource').value
        if (file) {
            formData.append('file', file)
        }

        //let imgUrl = this.memeForm.get('imgUrl').value
    
        if (imgUrl) {
            formData.append('url', imgUrl)
        }

        formData.append('title', title)
        formData.append('description', description)

        //const topText = this.memeForm.get('topText').value
        if (topText) {
            formData.append('topText', topText)
        }

        //const topSize = this.memeForm.get('topSize').value
        if (topSize) {
            formData.append('topSize', topSize)
        }

        //const topX = this.memeForm.get('topX').value
        if (topX) {
            formData.append('topX', topX)
        }

        //const topY = this.memeForm.get('topY').value
        if (topY) {
            formData.append('topY', topX)
        }

        //const topBold = this.memeForm.get('topBold').value
        if (topBold) {
            formData.append('topBold', topBold)
        }

        //const topItalic = this.memeForm.get('topItalic').value
        if (topItalic) {
            formData.append('topItalic', topItalic)
        }

        //const topColor = this.memeForm.get('topColor').value
        if (topColor) {
            formData.append('topColor', topColor)
        }

        //const bottomText = this.memeForm.get('bottomText').value
        if (bottomText) {
            formData.append('bottomText', bottomText)
        }

        //const bottomSize = this.memeForm.get('bottomSize').value
        if (bottomSize) {
            formData.append('bottomSize', bottomSize)
        }

        //const bottomX = this.memeForm.get('bottomX').value
        if (bottomX) {
            formData.append('bottomX', bottomX)
        }

        //const bottomY = this.memeForm.get('bottomY').value
        if (bottomY) {
            formData.append('bottomY', bottomY)
        }
        //const visibility = this.memeForm.get("visibility").value
        if(visibility) {
            formData.append('visibility', visibility)
        } else {
            formData.append('visibility', "public")
        }
        //const bottomBold = this.memeForm.get('bottomBold').value
        if (bottomBold) {
            formData.append('bottomBold', bottomBold)
        }

        //const bottomItalic = this.memeForm.get('bottomItalic').value
        if (bottomItalic) {
            formData.append('bottomItalic', bottomItalic)
        }

        //const bottomColor = this.memeForm.get('bottomColor').value
        if (bottomColor) {
            formData.append('bottomColor', bottomColor)
        }

        formData.append('userid', this.lss.getUserID().toString())
        formData.append('username', this.lss.getUsername())
        formData.append('cred', this.lss.getApiKey().toString())
        formData.append('tags', JSON.stringify(this.tags))
        formData.append('draft', "" + this.isDraft)

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

            console.log("FileEvent: ", file)

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
        this._memeService.deleteDraft(this.id).subscribe((res) => {
            this._router.navigate(['/memes'])
        })
    }

    /**
     * Saves the final draft and redirects to the meme-singleview
     */
    finishMeme(): void {
        this.isDraft = false
        const formData = this.generateMemeFormData()
        
        this._memeService.updateMeme(this.id, formData).subscribe((meme) => {
            this.meme = <Meme>meme
            this.id = this.meme._id
            console.log(this.meme)
            this._router.navigate(['/meme/' + this.id])
        })
    }

    /**
     * Since memes get created as draft by default only navigate to the overview
     */
    saveDraft(): void {
        this._router.navigate(['/memes'])
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
