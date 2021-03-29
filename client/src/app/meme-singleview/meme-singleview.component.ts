import {Component, OnInit, Input} from '@angular/core'
import {Meme} from '../meme'
import {HttpClient} from '@angular/common/http'
import {ActivatedRoute} from '@angular/router'
import {MemeService} from '../meme.service'
import {Router} from '@angular/router'
import {interval, Subscription} from 'rxjs'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import {LocalStorageService} from '../localStorage.service'
import { Userdata } from '../userdata'
import {ToastService} from '../toast-service'

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
                private toastService: ToastService) {
    }

    /**
     * loads memes
     */
    ngOnInit(): void {
        this._route.queryParams.subscribe(params => {
            console.log(params)
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
        console.log("liked Memes: ", this.localStorageService.getLikedMemes())
    }

    /**
     * loads current, prev and next meme
     */
    getMemes(): void {
        this.subscription = this._route.params.subscribe(params => {
            const id = params['id']
            this.memeService.getMeme(id).subscribe((data) => {
                // @ts-ignore
                this.selectedMeme = data
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

    vote(positive: boolean): void {
        this.memeService.voteMeme(this.selectedMeme._id, positive,
                                  this.userData._id, this.userData.username,
                                  this.userData.api_cred).subscribe((data) => {
            console.log("Voting: ", data)
            if (data.status == 'OK'){
                this.getMemes()
                this.localStorageService.updateLocalStorage()
                this.toastService.showSuccess(data.text)
            } else {
                this.toastService.showDanger(data.text)
            }
        })
    }

    commentMeme(formdata): void {
        this.memeService.commentMeme(this.selectedMeme._id, this.userData._id, this.userData.username, this.userData.api_cred, this.model.comment).subscribe((data) => {
            console.log('Comment: ', data)
        })
    }

    share(): void {
        const modalRef = this.modalService.open(NgbdModalContent)
        modalRef.componentInstance.url = this.selectedMeme.url
    }

    ngOnDestroy() {
        this.timer.unsubscribe();
    }

    isLoggedIn(): boolean {
        if(this.localStorageService.hasLocalStorage()){
            this.userData = <Userdata>this.localStorageService.getLocalStorage()
            return true
        }
        return false
    }
}
