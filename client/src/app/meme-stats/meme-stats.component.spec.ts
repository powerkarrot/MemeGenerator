import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MemeStatsComponent} from './meme-stats.component';

describe('MemeStatsComponent', () => {
    let component: MemeStatsComponent;
    let fixture: ComponentFixture<MemeStatsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemeStatsComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MemeStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
