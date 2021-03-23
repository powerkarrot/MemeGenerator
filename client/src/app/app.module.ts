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
import { RegisterComponent } from './register/register.component'

@NgModule({
    declarations: [
        AppComponent,
        MemeGeneratorComponent,
        MemeOverviewComponent,
        MemeSingleviewComponent,
        MemeRandomComponent,
        LoginDropdownComponent,
        RegisterComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatInputModule,
        InfiniteScrollModule,
        NgbModule,
        FormsModule,
        AngularMaterialModule
    ],
    providers: [],
    bootstrap: [AppComponent, LoginDropdownComponent]
})
export class AppModule {
}
