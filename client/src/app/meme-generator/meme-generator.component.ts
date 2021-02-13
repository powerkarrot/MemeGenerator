import {Component, OnInit} from '@angular/core'
import {FormBuilder, Validators} from '@angular/forms'
import {HttpClient} from '@angular/common/http'
import {environment} from '../../environments/environment'
import {Router} from '@angular/router'

@Component({
    selector: 'app-meme-generator',
    templateUrl: './meme-generator.component.html',
    styleUrls: ['./meme-generator.component.css']
})
export class MemeGeneratorComponent implements OnInit {

    memeForm: any

    constructor(
        private _formBuilder: FormBuilder,
        private _http: HttpClient,
        private _router: Router
    ) {
        this.memeForm = this._formBuilder.group({
            _id: [],
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
            }, Validators.required],
            topY: [{
                value: null,
                disabled: false
            }, Validators.required],
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

    ngOnInit(): void {

    }

    generateMeme(): void {
        const formData = new FormData()
        let file = this.memeForm.get('fileSource').value
        if (file) formData.append('file', file)
        formData.append('title', this.memeForm.get('title').value)
        formData.append('topText', this.memeForm.get('topText').value)
        formData.append('topX', this.memeForm.get('topX').value)
        formData.append('topY', this.memeForm.get('topY').value)
        let bottomText = this.memeForm.get('bottomText').value
        if (bottomText) formData.append('bottomText', bottomText)
        let bottomX = this.memeForm.get('bottomX').value
        if (bottomX) formData.append('bottomX', bottomX)
        let bottomY = this.memeForm.get('bottomY').value
        if (bottomY) formData.append('bottomY', bottomY)
        let url = environment.apiUrl + '/meme'
        this._http.post(url, formData).subscribe({
            next: data => {
                console.log(data)
                this._router.navigate(['/memes'])
            },
            error: error => {
                console.error(error)
            }
        })
    }

    onFileChange(event) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0]
            const name = file.name.split('.')[0]
            this.memeForm.patchValue({
                fileSource: file,
                name: name
            })
        }
    }

    onFileChangeTemplate(event) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0]
            const name = file.name.split('.')[0]
            const formData = new FormData()
            let url = environment.apiUrl + '/meme-template'

            formData.append('file', file)
            formData.append('name', name)

            this._http.post(url, formData).subscribe({
                next: data => {
                    console.log(data)
                    this._router.navigate(['/images'])
                },
                error: error => {
                    console.error(error)
                }
            })
        }
    }
}
