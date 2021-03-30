import {Component, OnInit} from '@angular/core'
import {FormBuilder, Validators} from '@angular/forms'
import {Router} from '@angular/router'
import {debounceTime} from 'rxjs/operators'
import {MemeService} from '../meme.service'
import {LocalStorageService} from '../localStorage.service'
import {COMMA, SEMICOLON} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {Tag} from '../tags'


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
    isLoggedIn = false

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
        private lss: LocalStorageService
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
     * loads templates (uploaded images)
     */
    loadTemplates(): void {
        this._memeService.loadTemplates().subscribe((templates) => {
            this.templates = templates
            this.templates = this.templates.map(i => 'http://localhost:3007/uploads/' + i)
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
        console.log(formData)
        this._memeService.updateMeme(this.id, formData).subscribe((meme) => {
            console.log(meme)
            this.meme = meme
            // @ts-ignore
            this.id = meme._id
        })
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
            formData.append('file', file)
        }

        const imgUrl = this.memeForm.get('imgUrl').value
        if (imgUrl) {
            formData.append('url', imgUrl)
        }

        formData.append('title', this.memeForm.get('title').value)
        formData.append('description', this.memeForm.get('description').value)

        const topText = this.memeForm.get('topText').value
        if (topText) {
            formData.append('topText', topText)
        }

        const topX = this.memeForm.get('topX').value
        if (topX) {
            formData.append('topX', topX)
        }

        const topY = this.memeForm.get('topY').value
        if (topY) {
            formData.append('topY', topX)
        }

        const bottomText = this.memeForm.get('bottomText').value
        if (bottomText) {
            formData.append('bottomText', bottomText)
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

        formData.append('userid', this.lss.getUserID().toString())
        formData.append('username', this.lss.getUsername())
        formData.append('cred', this.lss.getApiKey().toString())
        formData.append('tags', JSON.stringify(this.tags))

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
        this._memeService.deleteMeme(this.id).subscribe((res) => {
            this._router.navigate(['/memes'])
        })
    }

    /**
     * redirects to memes overview
     * (since it has been already saved)
     */
    finishMeme(): void {
        this._router.navigate(['/meme/' + this.id])
    }
}
