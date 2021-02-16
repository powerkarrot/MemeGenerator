import {CommonModule} from '@angular/common'
import {NgModule} from '@angular/core'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'
import {MatButtonToggleModule} from '@angular/material/button-toggle'

const materialModules = [
    MatIconModule,
    MatButtonToggleModule,
    MatButtonModule
]

@NgModule({
    imports: [
        CommonModule,
        ...materialModules
    ],
    exports: [
        ...materialModules
    ],
})

export class AngularMaterialModule {
}
