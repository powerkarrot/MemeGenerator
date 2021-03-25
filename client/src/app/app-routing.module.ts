import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'
import {MemeGeneratorComponent} from './meme-generator/meme-generator.component'
import {MemeRandomComponent} from './meme-random/meme-random.component'
import {MemeOverviewComponent} from './meme-overview/meme-overview.component'
import {MemeSingleviewComponent} from './meme-singleview/meme-singleview.component'
import {RegisterComponent} from './register/register.component'

const routes: Routes = [
    {path: 'register', component: RegisterComponent},
    {path: 'meme-random', component: MemeRandomComponent},
    {path: 'meme-generator', component: MemeGeneratorComponent},
    {path: 'meme/:id', component: MemeSingleviewComponent},
    {path: 'memes', component: MemeOverviewComponent},
    {path: '', component: MemeOverviewComponent},
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
