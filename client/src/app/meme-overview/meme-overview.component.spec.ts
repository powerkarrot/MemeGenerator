import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemeOverviewComponent } from './meme-overview.component';

describe('MemeOverviewComponent', () => {
  let component: MemeOverviewComponent;
  let fixture: ComponentFixture<MemeOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MemeOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemeOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
