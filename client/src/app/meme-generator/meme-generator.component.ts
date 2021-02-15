import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Router} from '@angular/router';
import {debounceTime} from 'rxjs/operators';

@Component({
    selector: 'app-meme-generator',
    templateUrl: './meme-generator.component.html',
    styleUrls: ['./meme-generator.component.css']
})
export class MemeGeneratorComponent implements OnInit {

    memeForm: any;
    meme: any = null;
    memeHidden: boolean = this.meme == null;
    id = null;

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

    ngOnInit(): void {
        this.memeForm.valueChanges
            .pipe(debounceTime(1000))
            .subscribe( formData => {
                console.log('ngOnInit', formData);
                this.updateMemeImg();
            });
    }

    onGenerateMemeButtonPressed(): void {
        const formData = this.generateMemeFormData();
        let url = environment.apiUrl + '/meme';
        if (this.id != null) {
            url = url + '/' + this.id;
        }
        this._http.post(url, formData).subscribe({
            next: data => {
                console.log(data);
                this._router.navigate(['/memes']);
            },
            error: error => {
                console.error(error);
            }
        })
    }

    /**
     * Updates the meme without navigating to /memes
     */
    updateMemeImg(): void{
        const formData = this.generateMemeFormData();
        let url = environment.apiUrl + '/meme';

        // if id is null the meme has not been created yet
        if (this.id != null) {
            url = url + '/' + this.id;
            console.log('id != null');
        }
        this._http.post<any>(url, formData).subscribe({
            next: data => {
                console.log('updateMemeImg()', data);
                this.meme = data;
                this.id = data._id;
            },
            error: error => {
                console.error(error)
            }
        })
    }

    private generateMemeFormData(): FormData {
        const formData = new FormData();
        const file = this.memeForm.get('fileSource').value;
        if (file) {
            formData.append('file', file);
        }
        formData.append('title', this.memeForm.get('title').value);
        formData.append('topText', this.memeForm.get('topText').value);
        formData.append('topX', this.memeForm.get('topX').value);
        formData.append('topY', this.memeForm.get('topY').value);

        const bottomText = this.memeForm.get('bottomText').value;
        if (bottomText) {
            formData.append('bottomText', bottomText);
        }

        const bottomX = this.memeForm.get('bottomX').value;
        if (bottomX) {
            formData.append('bottomX', bottomX);
        }

        const bottomY = this.memeForm.get('bottomY').value;
        if (bottomY) {
            formData.append('bottomY', bottomY);
        }
        return formData;
    }

    onFileChange(event): void {
        if (event.target.files.length > 0) {
            const file = event.target.files[0]
            const name = file.name.split('.')[0]
            this.memeForm.patchValue({
                fileSource: file,
                name: name
            })
        }
    }
}
