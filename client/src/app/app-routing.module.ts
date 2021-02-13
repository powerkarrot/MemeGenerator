import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'
import {MemeGeneratorComponent} from './meme-generator/meme-generator.component'
import {MemeComponent} from './meme/meme.component'
import {MemesComponent} from './memes/memes.component'
import {MemeImageComponent} from './meme-image/meme-image.component'


const routes: Routes = [
    {path: 'images', component: MemeImageComponent},
    {path: 'meme-generator', component: MemeGeneratorComponent},
    {path: 'meme/:id', component: MemeComponent},
    {path: 'memes', component: MemesComponent},
    {path: '', component: MemesComponent},

]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
