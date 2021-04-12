import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemeSingleviewComponent } from './meme-singleview.component';

// Includes
import {ActivatedRoute} from '@angular/router'
import {MemeService} from '../meme.service'
import {Router} from '@angular/router'
import {NgbModal} from '@ng-bootstrap/ng-bootstrap'
import {LocalStorageService} from '../localStorage.service'
import {ToastService} from '../toast-service'
import {isSaid, SPEECH_SYNTHESIS_VOICES, SpeechRecognitionService, SpeechSynthesisUtteranceOptions} from '@ng-web-apis/speech'
import {Observable} from 'rxjs'
/*
  @Inject(SPEECH_SYNTHESIS_VOICES)
  readonly voices$: Observable<ReadonlyArray<SpeechSynthesisVoice>>,
  @Inject(SpeechRecognitionService)
  private readonly recognition$: Observable<SpeechRecognitionResult[]>,) {
    }
*/

xdescribe('MemeSingleviewComponent', () => {
  let component: MemeSingleviewComponent;
  let fixture: ComponentFixture<MemeSingleviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivatedRoute, Router, NgbModal],
      providers: [MemeService, LocalStorageService, ToastService],
      declarations: [ MemeSingleviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemeSingleviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
