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
import {MemeOverviewComponent} from './meme-overview/meme-overview.component'
import {InfiniteScrollModule} from 'ngx-infinite-scroll'
import {MemeSingleviewComponent} from './meme-singleview/meme-singleview.component'
import {NgbModule} from '@ng-bootstrap/ng-bootstrap'
import {AngularMaterialModule} from './angular-material.module'

@NgModule({
    declarations: [
        AppComponent,
        MemeGeneratorComponent,
        MemeOverviewComponent,
        MemeSingleviewComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatInputModule,
        InfiniteScrollModule,
        NgbModule,
        AngularMaterialModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
