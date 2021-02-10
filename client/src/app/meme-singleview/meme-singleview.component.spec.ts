import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemeSingleviewComponent } from './meme-singleview.component';

describe('MemeSingleviewComponent', () => {
  let component: MemeSingleviewComponent;
  let fixture: ComponentFixture<MemeSingleviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MemeSingleviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemeSingleviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
