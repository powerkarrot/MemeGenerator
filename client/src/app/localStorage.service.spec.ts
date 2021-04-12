import { TestBed } from '@angular/core/testing'
import { UserService } from "./user.service"
import {Userdata} from "./userdata"
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing'
import {LocalStorageService} from './localStorage.service'
import {HttpClient} from '@angular/common/http'
import {environment} from '../environments/environment'

describe("LocalStorageService", () => {
  let localStorageService: LocalStorageService
  let httpTestingController: HttpTestingController

  beforeEach(()=>{

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LocalStorageService,
        UserService, {provide: HttpClient, useValue: HttpClientTestingModule}
      ]
    })

    localStorageService = TestBed.get(LocalStorageService)
    httpTestingController = TestBed.get(HttpTestingController)
    localStorageService.deleteLocalStorage()
    localStorageService.deleteVoiceControlStatus()
  })
  
  it('should be created', () => {
    expect(localStorageService).toBeTruthy();
  })

  it('should set the voice control status', () => {
    expect(localStorageService.getVoiceControlStatus()).toEqual(false)

    localStorageService.setVoiceControlStatus(true)

    expect(localStorageService.getVoiceControlStatus()).toEqual(true)
  })

  it('should save and load the userdata', () => {
    expect(localStorageService.hasLocalStorage()).toEqual(false)

    const userData: Userdata = {
        _id: 3424325231,
        username: "test",
        votes: [],
        memes: [],
        drafts: [],
        api_cred: 43249989782738129,
        comment: []
    }

    localStorageService.storeOnLocalStorage(userData)

    expect(localStorageService.getLocalStorage()).toEqual(userData)
  })
})
