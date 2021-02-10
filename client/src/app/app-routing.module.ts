import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'
import {MemeGeneratorComponent} from './meme-generator/meme-generator.component'
import {MemeComponent} from './meme/meme.component'
import {MemeOverviewComponent} from './meme-overview/meme-overview.component'

const routes: Routes = [
    {path: 'meme-generator', component: MemeGeneratorComponent},
    {path: 'meme/:id', component: MemeComponent},
    {path: 'memes', component: MemeOverviewComponent},
    {path: '', component: MemeOverviewComponent},
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
