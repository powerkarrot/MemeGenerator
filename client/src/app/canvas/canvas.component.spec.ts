import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CanvasComponent} from './login-dropdown.component';

describe('LoginDropdownComponent', () => {
    let component: CanvasComponent;
    let fixture: ComponentFixture<CanvasComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CanvasComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CanvasComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
