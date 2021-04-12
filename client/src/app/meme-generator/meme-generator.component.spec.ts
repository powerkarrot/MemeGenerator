import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MemeGeneratorComponent} from './meme-generator.component';

xdescribe('MemeGeneratorComponent', () => {
    let component: MemeGeneratorComponent;
    let fixture: ComponentFixture<MemeGeneratorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemeGeneratorComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MemeGeneratorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
