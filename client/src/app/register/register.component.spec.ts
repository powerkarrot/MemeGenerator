import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import {UserService} from '../user.service'

xdescribe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let userService: UserService

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [UserService],
      declarations: [ RegisterComponent ]
    })
    component = TestBed.inject(RegisterComponent)
    userService = TestBed.inject(UserService)
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
