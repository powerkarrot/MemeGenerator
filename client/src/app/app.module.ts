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
import {InfiniteScrollModule} from 'ngx-infinite-scroll'
import {MemeSingleviewComponent} from './meme-singleview/meme-singleview.component'
import {LoginDropdownComponent} from './login-dropdown/login-dropdown.component'
import {NgbModule} from '@ng-bootstrap/ng-bootstrap'
import {AngularMaterialModule} from './angular-material.module'
import { FormsModule } from '@angular/forms';
import { MemeSearchComponent } from './meme-search/meme-search.component'
import {MemeStatsComponent} from './meme-stats/meme-stats.component'
import { RegisterComponent } from './register/register.component'
import {StorageServiceModule} from 'ngx-webstorage-service'
import {LocalStorageService} from './localStorage.service'
import {UserPanelComponent} from './user-panel/user-panel.component'
import {ToastsContainer} from './toasts-container/toasts-container.component'
import {WebcamModule} from 'ngx-webcam'
import { ColorPickerModule } from 'ngx-color-picker'
import {MatCheckboxModule} from "@angular/material/checkbox"
import { NgxChartsModule } from '@swimlane/ngx-charts';


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
        MemeStatsComponent
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
        NgxChartsModule
    ],
    providers: [LocalStorageService],
    bootstrap: [AppComponent, LoginDropdownComponent]
})
export class AppModule {
}
