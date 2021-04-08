import {Component, Inject} from '@angular/core'
import {LocalStorageService} from './localStorage.service'
import {SpeechRecognitionService, SPEECH_SYNTHESIS_VOICES, isSaid} from '@ng-web-apis/speech'
import {filter, mapTo, repeat, retry, share} from 'rxjs/operators'
import {TuiContextWithImplicit, tuiPure} from '@taiga-ui/cdk'
import {Observable} from 'rxjs'
import {Router} from '@angular/router'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'client'
    voiceControl = false
    text = ''

    constructor(
        private localStorageService: LocalStorageService,
        @Inject(SPEECH_SYNTHESIS_VOICES)
        readonly voices$: Observable<ReadonlyArray<SpeechSynthesisVoice>>,
        @Inject(SpeechRecognitionService)
        private readonly recognition$: Observable<SpeechRecognitionResult[]>,
        private router: Router,
    ){
        this.localStorageService.setVoiceControlStatus(this.voiceControl)
    }

    toggleVoiceControl(): void {
        this.voiceControl = !this.voiceControl
        this.localStorageService.setVoiceControlStatus(this.voiceControl)
        this.text = this.voiceControl ? "Voice control activated!" : "Voice control deactivated"
    }

    getVoiceControlPermission(): void {
        this.getVoiceCommand("New Meme").subscribe((res) => {
            this.text = "Create new meme"
            const url = '/meme-generator/'
            this.router.navigateByUrl(url)
        })
        this.getVoiceCommand("Random Meme").subscribe((res) => {
            this.text = "Showing random meme"
            const url = '/meme-random/'
            this.router.navigateByUrl(url)
        })
    }

    getVoiceCommand(command: string): Observable<string> {
        return this.result$.pipe(filter(isSaid(command)), mapTo(command))
    }

    @tuiPure
    private get result$(): Observable<SpeechRecognitionResult[]> {
        return this.recognition$.pipe(retry(), repeat(), share());
    }
}
