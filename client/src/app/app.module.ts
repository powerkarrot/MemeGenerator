import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'

import {AppRoutingModule} from './app-routing.module'
import {AppComponent} from './app.component'
import {MemeGeneratorComponent} from './meme-generator/meme-generator.component'
import {ReactiveFormsModule} from '@angular/forms'
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import {MatFormFieldModule} from "@angular/material/form-field"
import {MatInputModule} from '@angular/material/input'
import {HttpClientModule} from '@angular/common/http'
import {MemesComponent} from './memes/memes.component'
import {MemeComponent} from './meme/meme.component'

@NgModule({
    declarations: [
        AppComponent,
        MemeGeneratorComponent,
        MemesComponent,
        MemeComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatInputModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
