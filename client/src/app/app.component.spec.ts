import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {SpeechRecognitionService, SPEECH_SYNTHESIS_VOICES, isSaid, SpeechSynthesisUtteranceOptions} from '@ng-web-apis/speech'
import {LocalStorageService} from './localStorage.service'

xdescribe('AppComponent', () => {

    let comp : AppComponent
    let lss : LocalStorageService

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule
            ],
            providers: [SpeechRecognitionService, LocalStorageService, SPEECH_SYNTHESIS_VOICES],
            declarations: [
                AppComponent
            ],
        })

        comp = TestBed.inject(AppComponent);
        lss = TestBed.inject(LocalStorageService);
        TestBed.inject(SpeechRecognitionService)
        TestBed.inject(SPEECH_SYNTHESIS_VOICES)
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    /*

    it(`should have as title 'client'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toEqual('client');
    });

    it('should render title', () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.content span').textContent).toContain('client app is running!');
    });
    */
});
