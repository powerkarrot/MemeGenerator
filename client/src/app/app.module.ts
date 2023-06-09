// Infinite Scroll Module for the meme overview
import {InfiniteScrollModule} from 'ngx-infinite-scroll'
// Bootstrap for better design
import {NgbModule} from '@ng-bootstrap/ng-bootstrap'
// Material Module includes from the google material design library
import {AngularMaterialModule} from './angular-material.module'
// Webcam Module for taking a image in the meme generation component
import {WebcamModule} from 'ngx-webcam'
// Color picker for changen the captions color
import { ColorPickerModule } from 'ngx-color-picker'
// Plots for the statistics
import { NgxChartsModule } from '@swimlane/ngx-charts'
// Speech recognition and text to speech
import {SpeechSynthesisModule} from '@ng-web-apis/speech'

import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'
import {AppRoutingModule} from './app-routing.module'
import {AppComponent} from './app.component'
import {MemeGeneratorComponent} from './meme-generator/meme-generator.component'
import {MemeRandomComponent} from './meme-random/meme-random.component'
import {ReactiveFormsModule} from '@angular/forms'
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import {MatInputModule} from '@angular/material/input'
import {HttpClientModule} from '@angular/common/http'
import {MemeOverviewComponent} from './meme-overview/meme-overview.component'
import {MemeSingleviewComponent} from './meme-singleview/meme-singleview.component'
import {LoginDropdownComponent} from './login-dropdown/login-dropdown.component'
import {FormsModule} from '@angular/forms'
import {MemeSearchComponent} from './meme-search/meme-search.component'
import {MemeStatsComponent} from './meme-stats/meme-stats.component'
import {RegisterComponent} from './register/register.component'
import {StorageServiceModule} from 'ngx-webstorage-service'
import {LocalStorageService} from './localStorage.service'
import {UserPanelComponent} from './user-panel/user-panel.component'
import {ToastsContainer} from './toasts-container/toasts-container.component'
import {MatCheckboxModule} from "@angular/material/checkbox"
import {MatCardModule} from '@angular/material/card'
import {MatDialogModule} from '@angular/material/dialog'
import {TemplateViewerComponent} from './template-viewer/template-viewer.component' 
import {MatExpansionModule} from '@angular/material/expansion'
import {CanvasComponent} from './canvas/canvas.component'
import {VideoStreamComponent} from './videostream/videostream.component'


@NgModule({
    declarations: [
        AppComponent,
        MemeGeneratorComponent,
        MemeOverviewComponent,
        MemeSingleviewComponent,
        MemeRandomComponent,
        MemeSearchComponent,
        LoginDropdownComponent,
        RegisterComponent,
        UserPanelComponent,
        ToastsContainer,   
        MemeStatsComponent,
        TemplateViewerComponent,
        CanvasComponent,
        VideoStreamComponent
    ],
    imports: [
        BrowserModule,
        WebcamModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatInputModule,
        InfiniteScrollModule,
        NgbModule,
        FormsModule,
        StorageServiceModule,
        AngularMaterialModule,
        ColorPickerModule,
        MatCheckboxModule,
        NgxChartsModule,
        MatCardModule,
        MatDialogModule,
        SpeechSynthesisModule,
        MatExpansionModule
    ],
    providers: [LocalStorageService],
    bootstrap: [AppComponent, LoginDropdownComponent]
})
export class AppModule {
}
