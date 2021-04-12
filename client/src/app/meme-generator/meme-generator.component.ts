import {Component, OnInit, Inject} from '@angular/core'
import {FormBuilder, Validators} from '@angular/forms'
import {Router} from '@angular/router'
import {debounceTime} from 'rxjs/operators'
import {MemeService} from '../meme.service'
import {WebcamImage} from 'ngx-webcam'
import {Subject, Observable, merge} from 'rxjs'
import {LocalStorageService} from '../localStorage.service'
import {ActivatedRoute} from '@angular/router'
import {COMMA, SEMICOLON} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {Tag} from '../tags'
import {Meme} from '../meme'
import {Template} from '../template'
import {ToastService} from '../toast-service'
import { TemplateViewerComponent } from '../template-viewer/template-viewer.component' 
import { CanvasComponent } from '../canvas/canvas.component'
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog'
import {continuous, isSaid, skipUntilSaid, SPEECH_SYNTHESIS_VOICES, SpeechRecognitionService,
    SpeechSynthesisUtteranceOptions, takeUntilSaid, final} from '@ng-web-apis/speech';
import {filter, mapTo, repeat, retry, share} from 'rxjs/operators';
import {TuiContextWithImplicit, tuiPure} from '@taiga-ui/cdk';
import { NgbdModalContent } from '../meme-singleview/meme-singleview.component'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'


enum Command {
    TITLE = 1,
    TOP_TEXT,
    BOTTOM_TEXT,
    DESCRIPTION,
    TOP_X,
    TOP_Y,
    BOTTOM_X,
    BOTTOM_Y,
    STOP
}

@Component({
    selector: 'app-meme-generator',
    templateUrl: './meme-generator.component.html',
    styleUrls: ['./meme-generator.component.scss']
})
export class MemeGeneratorComponent implements OnInit {

    memeForm: any
    meme: any = null
    template: any = {}
    id = null
    templates = null
    public webcamImage: WebcamImage = null
    private trigger: Subject<void> = new Subject<void>()
    public showWebcam = false
    public showScreenshot = false
    public showImgFlipTemplates = false
    public showUploadedTemplates = false
    isLoggedIn = false
    private isDraft = true
    private continueDraft = false
    screenhotURL

    visible = true
    selectable = true
    removable = true
    addOnBlur = true
    readonly separatorKeysCodes: number[] = [COMMA]
    tags: Tag[] = []
    panelOpenState = false
    panelmemeOpenState = false

    // Used for voice recognition
    text = ""
    paused = true
    voice = null
    result: Observable<SpeechRecognitionResult[]>
    currentCommand : Command
    templateIndex = -1
    
    readonly nameExtractor = ({
        $implicit,
    }: TuiContextWithImplicit<SpeechSynthesisVoice>) => $implicit.name;

    onEnd(): void {
        console.log('Speech synthesis ended');
    }

    getCommandText(command: Command): string {
        switch(command) {
            case Command.TITLE:
                return "Title"
            case Command.DESCRIPTION:
                return "Description"
            case Command.TOP_TEXT:
                return "Top text"
            case Command.TOP_X:
                return "Top X"
            case Command.TOP_Y:
                return "Top Y"
            case Command.BOTTOM_TEXT:
                return "Bottom text"
            case Command.BOTTOM_X:
                return "Bottom X"
            case Command.BOTTOM_Y:
                return "Bottom Y"
        }
    }

    speakText(text: string): void {
        // Re-trigger utterance pipe:
        this.text = ''
        this.text = text
    }

    activateVoiceControl() {
        this.paused = false
        this.getVoiceCommand("Show all memes").subscribe((res) => {
            this.text = "Navigating to memes overview"
            this._router.navigate(['/memes/'])
        })

        this.getVoiceCommand("Select templates").subscribe((res) => {
            this.speakText("Select templates")
            this.loadTemplates()
        })

        this.getVoiceCommand("Select image flip").subscribe((res) => {
            this.speakText("Select image flip")
            this.imgFlipAPITemplates()
        })

        this.getVoiceCommand("Use Webcam").subscribe((res) => {
            this.speakText("Webcam toggled")
            this.toggleWebcam()
        })

        this.getVoiceCommand("Take snapshot").subscribe((res) => {
            this.speakText("Snapshot taken")
            this.triggerSnapshot()
        })
        // Geht theoretisch aber bin anscheinend zu schlecht in der Aussprache...
        this.getVoiceCommand("Top bold").subscribe((res) => {
            const topBold = this.memeForm.get('topBold').value
            if (topBold) {
                this.speakText("Making bottom text bold")
                this.memeForm.patchValue({topBold: !topBold})
            }
        })

        this.getVoiceCommand("Make private").subscribe((res) => {
            this.speakText("Meme is now private")
            this.memeForm.patchValue({visibility: 'private'})
        })

        this.getVoiceCommand("Make public").subscribe((res) => {
            this.speakText("Meme is now public")
            this.memeForm.patchValue({visibility: 'public'})
        })

        this.getVoiceCommand("Make unlisted").subscribe((res) => {
            this.speakText("Meme is now unlisted")
            this.memeForm.patchValue({visibility: 'unlisted'})
        })

        this.getVoiceCommand("Delete Draft").subscribe((res) => {
            this.speakText("Deleting Draft")
            this.discardMeme()
        })
        
        this.getVoiceCommand("Save Draft").subscribe((res) => {
            this.speakText("Saving Draft")
            this.saveDraft()
        })

        this.getVoiceCommand("finish meme").subscribe((res) => {
            this.speakText("Finishing Meme")
            this.finishMeme()
        })

        this.getVoiceCommand("Next template").subscribe((res) => {
            if(this.templateIndex < this.templates.length) {
                this.templateIndex++
            }
            this.speakText("Next template")
            this.selectTemplate(this.templates[this.templateIndex])
            
        })

        this.getVoiceCommand("Previous template").subscribe((res) => {
            if(this.templateIndex > 0) {
                this.templateIndex--
            }
            this.speakText("Previous template")
            this.selectTemplate(this.templates[this.templateIndex])
        })

        this.command$.subscribe((command) => {
            this.currentCommand = command

            this.text = this.getCommandText(command) + " selected"

            if(command != Command.STOP) {
                this.getVoiceCommand("Begin " + this.getCommandText(command)).subscribe((res) => {
                    this.text = res
                }) 

                this.getVoiceCommand("Stop").subscribe((res) => {
                    this.text = res + " " + this.getCommandText(command)
                }) 

                this.result$.pipe(skipUntilSaid("Begin " + this.getCommandText(command)) ,takeUntilSaid('Stop'), repeat(), continuous()).subscribe((res) =>{
                    let text = res.pop()
                    if(text && text.isFinal) {
             
                        switch(command){
                            case Command.TITLE: {
                                this.memeForm.patchValue({title: text[0].transcript})
                                break
                            }
                            case Command.DESCRIPTION: {
                                this.memeForm.patchValue({description: text[0].transcript})
                                break
                            }
                            case Command.TOP_TEXT: {
                                this.memeForm.patchValue({topText: text[0].transcript})
                                break
                            }
                            case Command.TOP_X: {
                                this.memeForm.patchValue({topX: text[0].transcript})
                                break
                            }
                            case Command.TOP_Y: {
                                this.memeForm.patchValue({topY: text[0].transcript})
                                break
                            }
                            case Command.BOTTOM_TEXT: {
                                this.memeForm.patchValue({bottomText: text[0].transcript})
                                break
                            }
                            case Command.BOTTOM_X: {
                                this.memeForm.patchValue({bottomX: text[0].transcript})
                                break
                            }
                            case Command.BOTTOM_Y: {
                                this.memeForm.patchValue({bottomY: text[0].transcript})
                                break
                            }
                        }
                    }
                })
            }
        })
    }

    getVoiceCommand(command: string): Observable<string> {
        return this.result$.pipe(filter(isSaid(command)), mapTo(command))
    }

    @tuiPure
    get command$(): Observable<Command> {
        return merge(
            this.result$.pipe(filter(isSaid('Select title')), mapTo(Command.TITLE)),
            this.result$.pipe(filter(isSaid('Select description')), mapTo(Command.DESCRIPTION)),
            this.result$.pipe(filter(isSaid('Select top text')), mapTo(Command.TOP_TEXT)),
            this.result$.pipe(filter(isSaid('Select bottom text')), mapTo(Command.BOTTOM_TEXT)),
            this.result$.pipe(filter(isSaid('Select top x')), mapTo(Command.TOP_X)),
            this.result$.pipe(filter(isSaid('Select top y')), mapTo(Command.TOP_Y)),
            this.result$.pipe(filter(isSaid('Select bottom x')), mapTo(Command.BOTTOM_X)),
            this.result$.pipe(filter(isSaid('Select bottom y')), mapTo(Command.BOTTOM_Y)),
            this.result$.pipe(filter(isSaid('Stop listening')), mapTo(Command.STOP)),
        );
    }

    onClick() {
        this.paused = !this.paused;
        // Re-trigger utterance pipe:
        this.text = this.paused ? this.text + ' ' : this.text;
    }

    voiceByName(_: number, {name}: SpeechSynthesisVoice): string {
        return name;
    }

    get options(): SpeechSynthesisUtteranceOptions {
        return this.getOptions(this.voice);
    }

    @tuiPure
    get record$(): Observable<SpeechRecognitionResult[]> {
        return this.result$.pipe(
            skipUntilSaid('Start'),
            takeUntilSaid('Stop'),
            repeat(),
            continuous(),
        );
    }

    @tuiPure
    get open$(): Observable<boolean> {
        return merge(
            this.result$.pipe(filter(isSaid('Show sidebar')), mapTo(true)),
            this.result$.pipe(filter(isSaid('Hide sidebar')), mapTo(false)),
        );
    }

    @tuiPure
    private get result$(): Observable<SpeechRecognitionResult[]> {
        return this.recognition$.pipe(retry(), repeat(), share());
    }

    @tuiPure
    private getOptions( voice: SpeechSynthesisVoice | null,): SpeechSynthesisUtteranceOptions {
        return {
            lang: 'en-US',
            voice,
        };
    }


    /**
     * 
     * @param modalService 
     * @param _formBuilder 
     * @param _router 
     * @param _memeService 
     * @param lss 
     * @param _route 
     * @param toastService 
     * @param dialog 
     * @param voices$ 
     * @param recognition$ 
     */
    constructor(
        private modalService: NgbModal,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _memeService: MemeService,
        private lss: LocalStorageService,
        private _route: ActivatedRoute,
        private toastService: ToastService,
        public dialog: MatDialog,
        @Inject(SPEECH_SYNTHESIS_VOICES)
        readonly voices$: Observable<ReadonlyArray<SpeechSynthesisVoice>>,
        @Inject(SpeechRecognitionService)
        private readonly recognition$: Observable<SpeechRecognitionResult[]>,

    ) {
        this.memeForm = this._formBuilder.group({
            _id: [],
            imgUrl: [{
                value: null,
                disabled: false
            }],
            screenshotUrl: [{
                value: null,
                disabled: false
            }],
            voiceAssistant: [{
                value: null,
                disabled: false
            }],
            template: [{
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

            thirdText: [{
                value: null,
                disabled: false
            }],
            thirdSize: [{
                value: null,
                disabled: false
            }],
            thirdX: [{
                value: null,
                disabled: false
            }],
            thirdY: [{
                value: null,
                disabled: false
            }],
            thirdBold: [{
                value: null,
                disabled: false
            }],
            thirdItalic: [{
                value: null,
                disabled: false
            }],
            thirdColor: [{
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

        this.currentCommand = Command.STOP
        if(this.lss.getVoiceControlStatus()) {
            this.activateVoiceControl()
        }
    }

    /**
     * watches meme for changes and updates it
     */
    ngOnInit(): void {

        this._route.params.subscribe(params => {
            if(params.id) {
                const id = params['id']
                this.continueDraft = true
                this.getDraft(id)
            }
        })

        this.memeForm.valueChanges
            .pipe(debounceTime(500))
            .subscribe(formData => {
                this.updateMeme()
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
            template: url
        })
        this.updateTemplate(url)
    }

    /**
     * updates selected template
     * @param url 
     */
    updateTemplate(url) {
        this.template.url = url

        this._memeService.updateTemplate(this.template, false, false).subscribe((t) =>
        {     
            this.template = t
            this.template.url = url
        })      
    }

    /**
     * opens dialog to view and edit the selected template
     * sets current template 
    */
    openDialog(): void {

        const dialogRef = this.dialog.open(TemplateViewerComponent, {
          width: '40%',
          data: {template : this.template}
        });

        dialogRef.afterClosed().subscribe(result => {
            if(result !== undefined) {
                this.template = result;
                this._memeService.updateTemplate(this.template, false, true).subscribe((template) => {
                })
            }
        });
      }

      openCanvas() {
        const dialogRef = this.dialog.open(CanvasComponent, {restoreFocus: false});
    
        // Manually restore focus to the menu trigger since the element that
        // opens the dialog won't be in the DOM any more when the dialog closes.
        dialogRef.afterClosed().subscribe(result => {

            let file = this.dataurlToFile(result.src, result.id)

            this.memeForm.patchValue({
                fileSource: file,
                name: file.name,
                imgUrl: null
            })
            let name = result.id
            this.template.url = "http://localhost:3007/uploads/" + name
            this.selectTemplate(this.template.url)
        });
      }

    /**
     * updates the meme
     */
    updateMeme(): void {
        if(!this.continueDraft) {
            
            const formData = this.generateMemeFormData()
    
            this._memeService.updateMeme(this.id, formData).subscribe((meme) => {
                this.meme = meme
                // @ts-ignore
                this.id = meme._id
                //let name = meme.template.split("/").pop()
                //this.template.url = "http://localhost:3007/uploads/" + name
                this.updateTemplate(meme.template)
            })
        }
        this.continueDraft = false
    }

    getDraft(id): void {
        this._memeService.getDrafts({_id: id}).subscribe((draft) => {
            this.meme = draft[0]
            
            this.patchMemeData(this.meme.url, this.meme.title, this.meme.description, this.meme.topText, this.meme.topSize, this.meme.topX, this.meme.topY,
                this.meme.topBold, this.meme.topItalic, this.meme.topColor, this.meme.bottomText, this.meme.bottomSize, this.meme.bottomX,
                this.meme.bottomY, this.meme.bottomBold, this.meme.bottomItalic, this.meme.bottomColor, this.meme.thirdText, this.meme.thirdSize, this.meme.thirdX,
                this.meme.thirdY, this.meme.thirdBold, this.meme.thirdItalic, this.meme.thirdColor, this.meme.visibility, this.meme.template)
            this.id = this.meme._id
        })
    }

    private patchMemeData(imgUrl: string, title: string, description: string,
        topText: string, topSize: string, topX: string, topY: string, topBold: string, topItalic: string, topColor: string,
        bottomText: string, bottomSize: string, bottomX: string, bottomY: string, bottomBold, bottomItalic: string,bottomColor: string,
        thirdText: string, thirdSize: string, thirdX: string, thirdY: string, thirdBold, thirdItalic: string,thirdColor: string,
        visibility: string, template: string): void {

            if(imgUrl)
                this.memeForm.patchValue({imgUrl: imgUrl})
            if(template)
                this.memeForm.patchValue({template: template})
            if(title)
                this.memeForm.patchValue({title: title})
            if(description)
                this.memeForm.patchValue({description: description})
            if(topText)
                this.memeForm.patchValue({topText: topText})
            if(topSize)
                this.memeForm.patchValue({topSize: topSize})
            if(topX)
                this.memeForm.patchValue({topX: topX})
            if(topY)
                this.memeForm.patchValue({topY: topY})
            if(topBold)
                this.memeForm.patchValue({topBold: topBold})
            if(topItalic)
                this.memeForm.patchValue({topItalic: topItalic})
            if(topColor)
                this.memeForm.patchValue({topColor: topColor})
            if(bottomText)
                this.memeForm.patchValue({bottomText: bottomText})
            if(bottomSize)
                this.memeForm.patchValue({bottomSize: bottomSize})
            if(bottomX)
                this.memeForm.patchValue({bottomX: bottomX})
            if(bottomY)
                this.memeForm.patchValue({bottomY: bottomY})
            if(bottomBold)
                this.memeForm.patchValue({bottomBold: bottomBold})
            if(bottomItalic)
                this.memeForm.patchValue({bottomItalic: bottomItalic})
            if(bottomColor)
                this.memeForm.patchValue({bottomColor: bottomColor})
            if(thirdText)
                this.memeForm.patchValue({thirdText: thirdText})
            if(thirdSize)
                this.memeForm.patchValue({thirdSize: thirdSize})
            if(thirdX)
                this.memeForm.patchValue({thirdX: thirdX})
            if(thirdY)
                this.memeForm.patchValue({thirdY: thirdY})
            if(thirdBold)
                this.memeForm.patchValue({thirdBold: thirdBold})
            if(thirdItalic)
                this.memeForm.patchValue({thirdItalic: thirdItalic})
            if(thirdColor)
                this.memeForm.patchValue({thirdColor: thirdColor})
            if(visibility)
                this.memeForm.patchValue({visibility: visibility})
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
            //formData.append('file', file)
            formData.append('file', file, file.name);
        }

        const template = this.memeForm.get('template').value
        if(template) {
            formData.append('template', template)
        }

        let imgUrl = this.memeForm.get('imgUrl').value
    
        if (imgUrl) {
            formData.append('url', imgUrl)
        }

        formData.append('title', this.memeForm.get('title').value)
        formData.append('description', this.memeForm.get('description').value)

        const topText = this.memeForm.get('topText').value
        if (topText) {
            formData.append('topText', topText)
        }

        const topSize = this.memeForm.get('topSize').value
        if (topSize) {
            formData.append('topSize', topSize)
        }

        const topX = this.memeForm.get('topX').value
        if (topX) {
            formData.append('topX', topX)
        }

        const topY = this.memeForm.get('topY').value
        if (topY) {
            formData.append('topY', topX)
        }

        const topBold = this.memeForm.get('topBold').value
        if (topBold) {
            formData.append('topBold', topBold)
        }

        const topItalic = this.memeForm.get('topItalic').value
        if (topItalic) {
            formData.append('topItalic', topItalic)
        }

        const topColor = this.memeForm.get('topColor').value
        if (topColor) {
            formData.append('topColor', topColor)
        }
        const thirdText = this.memeForm.get('thirdText').value
        if (thirdText) {
            formData.append('thirdText', thirdText)
        }

        const thirdSize = this.memeForm.get('thirdSize').value
        if (thirdSize) {
            formData.append('thirdSize', thirdSize)
        }

        const thirdX = this.memeForm.get('thirdX').value
        if (thirdX) {
            formData.append('thirdX', thirdX)
        }

        const thirdY = this.memeForm.get('thirdY').value
        if (thirdY) {
            formData.append('thirdY', thirdX)
        }

        const thirdBold = this.memeForm.get('thirdBold').value
        if (thirdBold) {
            formData.append('thirdBold', thirdBold)
        }

        const thirdItalic = this.memeForm.get('thirdItalic').value
        if (thirdItalic) {
            formData.append('thirdItalic', thirdItalic)
        }

        const thirdColor = this.memeForm.get('thirdColor').value
        if (thirdColor) {
            formData.append('thirdColor', thirdColor)
        }
        const bottomText = this.memeForm.get('bottomText').value
        if (bottomText) {
            formData.append('bottomText', bottomText)
        }

        const bottomSize = this.memeForm.get('bottomSize').value
        if (bottomSize) {
            formData.append('bottomSize', bottomSize)
        }

        const bottomX = this.memeForm.get('bottomX').value
        if (bottomX) {
            formData.append('bottomX', bottomX)
        }

        const bottomY = this.memeForm.get('bottomY').value
        if (bottomY) {
            formData.append('bottomY', bottomY)
        }
        const visibility = this.memeForm.get("visibility").value
        if(visibility) {
            formData.append('visibility', visibility)
        } else {
            formData.append('visibility', "public")
        }
        const bottomBold = this.memeForm.get('bottomBold').value
        if (bottomBold) {
            formData.append('bottomBold', bottomBold)
        }

        const bottomItalic = this.memeForm.get('bottomItalic').value
        if (bottomItalic) {
            formData.append('bottomItalic', bottomItalic)
        }

        const bottomColor = this.memeForm.get('bottomColor').value
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
        this._memeService.deleteDraft(this.id, this.lss.getUserID(), this.lss.getApiKey()).subscribe((res) => {
            if(res.status == "ERROR")
            {
                this.toastService.showDanger(res.text)
            } else {
                this._router.navigate(['/memes'])
            }
        })
    }

    /**
     * Saves the final draft and redirects to the meme-singleview
     * Updates template information
     */
    finishMeme(): void {
        this.isDraft = false
        const formData = this.generateMemeFormData()

        this._memeService.updateTemplate(this.template, true, false).subscribe((template) => { 
            this.template = template
        })
              
        this._memeService.updateMeme(this.id, formData).subscribe((meme) => {
            this.meme = <Meme>meme
            this.id = this.meme._id
            this._router.navigate(['/meme/' + this.id])
        })
    }

    /**
     * Since memes get created as draft by default only navigate to the overview
     */
    saveDraft(): void {
        this.lss.updateLocalStorage()
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
     * Toggles webcam visibility
     */
     public toggleScreenshot(): void {
        this.showScreenshot = !this.showScreenshot;
    }

    /**
     * Takes screenshot
     */
    public takeScreenshot(): void {
        this._memeService.takeScreenshot(this.screenhotURL).subscribe(screenshot => {

            this.selectTemplate(screenshot.url)
        })
    }

    /**
     * Handles captured webcam image
     * 
     * @param webcamImage 
     */
    handleImage(webcamImage: WebcamImage): void {

        this.webcamImage = webcamImage  
        //let filename =  "webcamImage.jpeg"
        let filename = "webcamImage_" + Math.floor((Math.random()*10000000)+1).toString() + ".jpeg"

        this.memeForm.patchValue({
            fileSource: this.dataurlToFile(webcamImage.imageAsDataUrl, filename),
            name: filename,
            imgUrl: null
        })
        this.template.url = "http://localhost:3007/uploads/" + filename
        this.selectTemplate(this.template.url)

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

      /**
     * Opens a share meme modal
     */
       share(): void {
        const modalRef = this.modalService.open(NgbdModalContent)
        modalRef.componentInstance.url = this.meme.url
    }

    /**
     * Selects next template
     */
    nextTemplate() {
        if(this.templateIndex < this.templates.length) {
            this.templateIndex++
        }
        this.selectTemplate(this.templates[this.templateIndex])
    }

    /**
     * Selects previous template
     */
    prevTemplate() {
        if(this.templateIndex > 0) {
            this.templateIndex--
        }
        this.selectTemplate(this.templates[this.templateIndex])
    }
}
