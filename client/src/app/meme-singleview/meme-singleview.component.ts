import {Component, OnInit, Input, Inject} from '@angular/core'
import {Meme} from '../meme'
import {HttpClient} from '@angular/common/http'
import {ActivatedRoute} from '@angular/router'
import {MemeService} from '../meme.service'
import {Router} from '@angular/router'
import {interval, Subscription} from 'rxjs'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import {LocalStorageService} from '../localStorage.service'
import { Userdata } from '../userdata'
import {Tag} from '../tags'
import {ToastService} from '../toast-service'
import {COMMA, SEMICOLON} from '@angular/cdk/keycodes'
import {MatChipInputEvent} from '@angular/material/chips'
import {continuous, isSaid, skipUntilSaid, SPEECH_SYNTHESIS_VOICES, SpeechRecognitionService,
    SpeechSynthesisUtteranceOptions, takeUntilSaid, final} from '@ng-web-apis/speech'
import {filter, mapTo, repeat, retry, share} from 'rxjs/operators'
import {TuiContextWithImplicit, tuiPure} from '@taiga-ui/cdk'
import {Subject, Observable, merge} from 'rxjs'

@Component({
    selector: 'ngbd-modal-content',
    styleUrls: ['./meme-singleview.component.css'],
    template: `
    <div class="modal-header">
      <h4 class="modal-title">Share meme!</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
        <input type="url" class="form-control" id="memeUrl" aria-describedby="memeUrl" value="{{url}}" #memeUrl>
        <button class="btn-primary accent" (click)="copyMemeUrl(memeUrl)">Copy</button>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-dark" (click)="activeModal.close('Close click')">Close</button>
    </div>
  `
})
export class NgbdModalContent {
    @Input() url;

    constructor(public activeModal: NgbActiveModal) {}

    copyMemeUrl(inputElement) {
        inputElement.select()
        document.execCommand('copy')
        inputElement.setSelectionRange(0, 0)
    }
}

@Component({
    selector: 'app-meme-singleview',
    templateUrl: './meme-singleview.component.html',
    styleUrls: ['./meme-singleview.component.css']
})
export class MemeSingleviewComponent implements OnInit {

    selectedMeme: Meme
    prevMeme: Meme
    nextMeme: Meme
    subscription: any
    timer: any
    userData: Userdata

    model = {
        autoplay: false,
        random: false,
        comment: ""
    }
    loggedIn = false

    // Tags
    visible = true;
    selectable = true;
    removable = false;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [COMMA, SEMICOLON];
    tags: Tag[] = [];

    
    // Voice recognition
    text = ""
    paused = false
    voice = null

    /**
     *
     * @param _http
     * @param _route
     * @param memeService
     */
    constructor(private _http: HttpClient,
                private _route: ActivatedRoute, 
                private memeService: MemeService, 
                private router: Router,
                private modalService: NgbModal,
                private localStorageService: LocalStorageService,
                private toastService: ToastService,
                @Inject(SPEECH_SYNTHESIS_VOICES)
                readonly voices$: Observable<ReadonlyArray<SpeechSynthesisVoice>>,
                @Inject(SpeechRecognitionService)
                private readonly recognition$: Observable<SpeechRecognitionResult[]>,) {
    }

    /**
     * loads memes
     */
    ngOnInit(): void {
        this._route.queryParams.subscribe(params => {
            if(params.autoplay === 'true') {
                this.model.autoplay = true
                this.onAutoplayClicked(null)
            }
            if(params.random === 'true') {
                this.model.random = true
            }
        })
        this.getMemes()
        this.loggedIn = this.isLoggedIn()
    }

    /**
     * Adds a tag to the tags array and uploads it to the server
     * @param event 
     */
    add(event: MatChipInputEvent): void {
        const input = event.input
        const value = event.value
    
        if ((value || '').trim()) {
            const tag = {name: value.trim()}
            this.tags.push(tag)
            this.selectedMeme.tags.push(tag)
            this.memeService.commitTags(this.selectedMeme._id, tag, this.userData._id, this.userData.api_cred).subscribe((data)=>{
                if(data.status == "ERROR")
                    this.toastService.showDanger(data.text)

                this.getMemes()
            })
        }
    
        if (input) {
            input.value = ''
        }

        
    }

    /**
     * Binds some voice commands to a button
     * @param $event 
     */
    onVoiceControlClicked($event): void {
        this.getVoiceCommand("Next meme").subscribe((res) => {
            if(this.nextMeme) {
                this.text = "Next meme"
                const url = '/meme/' + this.nextMeme._id
                this.router.navigateByUrl(url)
            } else {
                this.text = "There is no next meme"
            }
        })

        this.getVoiceCommand("Previous meme").subscribe((res) => {
            if(this.prevMeme) {
                this.text = "Previous meme"
                const url = '/meme/' + this.prevMeme._id
                this.router.navigateByUrl(url)
            } else {
                this.text = "There is no previous meme"
            }
        })

        this.getVoiceCommand("Describe meme").subscribe((res) => {
            this.sayMeme(this.selectedMeme)
        })

        this.getVoiceCommand("Like meme").subscribe((res) => {
            this.text = "You liked this meme!"
            this.vote(true)
        })

        this.getVoiceCommand("Dislike meme").subscribe((res) => {
            this.text = "You disliked this meme!"
            this.vote(false)
        })
        
        
    }

    
    @tuiPure
    private getOptions( voice: SpeechSynthesisVoice | null,): SpeechSynthesisUtteranceOptions {
        return {
            lang: 'en-US',
            voice,
        };
    }

    get options(): SpeechSynthesisUtteranceOptions {
        return this.getOptions(this.voice);
    }

    /**
     * Helper function to listen to a certain word
     * @param command Word that should be listened for
     * @returns Observable to subscribe to
     */
    getVoiceCommand(command: string): Observable<string> {
        return this.result$.pipe(filter(isSaid(command)), mapTo(command))
    }

    /**
     * Voice recognition result property used to build voice commands
     */
    @tuiPure
    private get result$(): Observable<SpeechRecognitionResult[]> {
        return this.recognition$.pipe(retry(), repeat(), share());
    }
    
    /**
     * Removes a tag from the tags array
     * @param tags 
     */
    remove(tags: Tag): void {
        const index = this.tags.indexOf(tags);
    
        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    }

    /**
     * loads current, prev and next meme
     */
    getMemes(): void {
        this.subscription = this._route.params.subscribe(params => {
            const id = params['id']
            this.memeService.getMeme(id).subscribe((data) => {
                // @ts-ignore
                this.selectedMeme = <Meme>data
                //this.sayMeme(this.selectedMeme)
                console.log(this.selectedMeme)
            })
            let options = {
                limit: 1,
                sort: {_id: -1}
            }
            this.memeService.getMemes({_id: {$lt: id}}, options).subscribe((data) => {
                this.nextMeme = data[0]
            })
            options.sort._id = 1
            this.memeService.getMemes({_id: {$gt: id}}, options).subscribe((data) => {
                this.prevMeme = data[0]
            })
        })
    }

    /**
     * Navigate to stats view
     */
    memeStats(): void {
        
        this.router.navigate(['/stats/' + this.selectedMeme._id])
    }

    /**
     * Activates autoplay for memes
     * @param $event 
     */
    onAutoplayClicked($event): void {
        if (this.model.autoplay == true) {
            this.timer = interval(5000).subscribe((val) => {
                if(this.model.autoplay == true) {
                    if(this.model.random) {
                        this.memeService.getRandomMeme().subscribe((data) => {
                            const meme = <Meme>data
                            const url = '/meme/' + meme._id + '?autoplay=true&random=true'
                            this.router.navigateByUrl(url)
                        })
                    } else {
                        const url = '/meme/' + this.nextMeme._id + '?autoplay=true'
                        this.router.navigateByUrl(url)
                    }
                }
            })
        } else {
            this.timer.unsubscribe()
        }
    }

    /**
     * Voting function for memes
     * @param positive Vote is positive or negative?
     */
    vote(positive: boolean): void {
        this.memeService.voteMeme(this.selectedMeme._id, positive,
                                  this.userData._id, this.userData.username,
                                  this.userData.api_cred).subscribe((data) => {
            if (data.status == 'OK'){
                this.getMemes()
                this.localStorageService.updateLocalStorage()
                this.toastService.showSuccess(data.text)
            } else {
                this.toastService.showDanger(data.text)
            }
        })
    }

    /**
     * Post comment on meme
     * @param formdata the formdata
     */
    commentMeme(formdata): void {
        this.memeService.commentMeme(this.selectedMeme._id, this.userData._id, this.userData.username, this.userData.api_cred, this.model.comment).subscribe((data) => {
        })
    }

    /**
     * Opens a share meme modal
     */
    share(): void {
        const modalRef = this.modalService.open(NgbdModalContent)
        modalRef.componentInstance.url = this.selectedMeme.url
    }

    /**
     * Deconstructor
     */
    ngOnDestroy() {
        if (this.timer != null) this.timer.unsubscribe();
    }

    /**
     * Check whenever a user is logged in
     * @returns the login status
     */
    isLoggedIn(): boolean {
        if(this.localStorageService.hasLocalStorage()){
            this.userData = <Userdata>this.localStorageService.getLocalStorage()
            return true
        }
        return false
    }

    /**
     * Function used to say a meme
     * @param meme meme
     */
    sayMeme(meme: Meme): void {
        this.paused = false
        this.text = this.describeMeme(meme)
        console.log("sayMeme: ", meme)
    }

    /**
     * On TTS end
     */
    onEnd() {
        this.paused = !this.paused;
        // Re-trigger utterance pipe:
        this.text = this.paused ? this.text + ' ' : this.text;
    }

    /**
     * Gets a string representation of a meme for availability purposes
     * @param meme 
     * @returns 
     */
    describeMeme(meme: Meme): string {
        let text = "The title of the meme is: " + meme.title + " and has a description stating: " + meme.description
        if(meme.topText) {
            text += ", having a top text with caption: " + meme.topText
        }
        if(meme.bottomText) {
            text += " and a bottom caption stating: " + meme.bottomText
        }
        text += ", this meme has " + meme.views + " views and " + meme.votes + " votes."
        return text
    }
}
